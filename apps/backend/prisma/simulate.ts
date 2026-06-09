import { PrismaClient, PotholeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runSimulator() {
  console.log('📡 Initializing IoT Telemetry Simulator...');

  // Generate 15 synthetic road hazards with random severities
  const hazards = Array.from({ length: 15 }).map((_, i) => ({
    pothole_code: `PTH-88${i}-${Math.floor(Math.random() * 1000)}`,
    title: `Automated Detection: Zone ${['Alpha', 'Beta', 'Gamma'][i % 3]}`,
    description: 'High-impact vibration anomaly detected via edge node.',
    latitude: 12.9716 + (Math.random() - 0.5) * 0.1, // Bangalore coordinates roughly
    longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
    severity_score: parseFloat((Math.random() * 10).toFixed(1)),
    confidence_score: parseFloat((Math.random() * 100).toFixed(1)),
    current_status: (Math.random() > 0.7 ? PotholeStatus.verified : PotholeStatus.detected),
  }));

  try {
    const result = await prisma.pothole.createMany({
      data: hazards,
      skipDuplicates: true,
    });
    console.log(`🚨 ALERT: ${result.count} critical road hazards ingested into the active backlog!`);
    console.log('✅ Simulation complete. Return to your dashboard.');
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runSimulator();