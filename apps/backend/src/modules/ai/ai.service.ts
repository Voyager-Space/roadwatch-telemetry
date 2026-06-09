import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PotholesService } from '../potholes/potholes.service';
import { GenerateAISummaryDto, AISummaryDto } from '@roadwatch/shared-types';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly genAI?: GoogleGenerativeAI; 

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly potholesService: PotholesService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is missing. AI summarization will fail.');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  async generateSummary(dto: GenerateAISummaryDto): Promise<AISummaryDto> {
    const { potholeId, forceRegenerate } = dto;

    if (!forceRegenerate) {
      const existingSummary = await this.prisma.aiSummary.findFirst({
        where: {
          pothole: { id: potholeId },
          cached_until: { gt: new Date() },
        },
      });

      if (existingSummary) {
        this.logger.debug(`Returning cached AI summary for pothole ${potholeId}`);
        return this.mapToDto(existingSummary);
      }
    }

    const pothole = await this.potholesService.findOne(potholeId);
    if (!pothole) {
      throw new NotFoundException(`Pothole ${potholeId} not found for AI analysis`);
    }

    const prompt = this.buildEngineeringPrompt(pothole);
    const aiResponse = await this.callGeminiApi(prompt);

    const cachedUntil = new Date();
    cachedUntil.setHours(cachedUntil.getHours() + 24);

    const savedSummary = await this.prisma.$transaction(async (tx) => {
      const summary = await tx.aiSummary.create({
        data: {
          summary_text: aiResponse.summaryText,
          maintenance_note: aiResponse.maintenanceNote,
          repair_recommendation: aiResponse.repairRecommendation,
          generated_model: 'gemini-1.5-flash',
          cached_until: cachedUntil,
        },
      });

      await tx.pothole.update({
        where: { id: potholeId },
        data: { ai_summary_id: summary.id },
      });

      return summary;
    });

    this.logger.log(`Generated new AI summary for pothole ${potholeId}`);
    return this.mapToDto(savedSummary);
  }

  private buildEngineeringPrompt(pothole: any): string {
    // Adjusted to match the newly mapped camelCase parameters returned by findOne()
    const eventsSummary = pothole.events.map((e: any) => 
      `- Impact: ${Number(e.impactForce || 0).toFixed(1)}g, Speed: ${e.speedEstimate || 'Unknown'} km/h`
    ).join('\n');

    return `
      You are an expert civil engineering AI assistant for a municipal public works department.
      Analyze the following telemetry data for a detected pothole.
      
      POTHOLE DATA:
      - ID: ${pothole.potholeCode}
      - Location: ${pothole.roadName || 'Unknown Road'}, ${pothole.city || 'Unknown City'}
      - Severity Score: ${pothole.severityScore}/10
      - Status: ${pothole.currentStatus}
      - Event Count: ${pothole.events.length} recent telemetry pings
      
      RECENT IMPACT TELEMETRY:
      ${eventsSummary || 'No recent impacts recorded.'}
    `;
  }

  private async callGeminiApi(prompt: string): Promise<any> {
    if (!this.genAI) {
      throw new InternalServerErrorException('AI subsystem is not configured (Missing API Key).');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              summaryText: { 
                type: SchemaType.STRING, 
                description: "A 2-3 sentence executive summary of the road condition." 
              },
              maintenanceNote: { 
                type: SchemaType.STRING, 
                description: "Specific risks to vehicles or safety hazards." 
              },
              repairRecommendation: { 
                type: SchemaType.STRING, 
                description: "Required materials and estimated crew size based on severity." 
              }
            },
            required: ["summaryText", "maintenanceNote", "repairRecommendation"]
          }
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      return JSON.parse(responseText);

    } catch (error) {
      this.logger.error('Failed to generate AI content', error);
      throw new InternalServerErrorException('Failed to process AI analysis. Please try again later.');
    }
  }

  private mapToDto(summary: any): AISummaryDto {
    return {
      id: summary.id,
      summaryText: summary.summary_text,
      maintenanceNote: summary.maintenance_note || undefined,
      repairRecommendation: summary.repair_recommendation || undefined,
      generatedAt: summary.generated_at,
    };
  }
}