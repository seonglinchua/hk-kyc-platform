import bcrypt from 'bcryptjs';
import prisma from './database.js';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('password', 10);

    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      }
    });

    console.log('✅ Created admin user:', user.email);

    // Create sample relationship manager
    const rm = await prisma.user.upsert({
      where: { email: 'rm@example.com' },
      update: {},
      create: {
        email: 'rm@example.com',
        username: 'rmuser',
        password: hashedPassword,
        name: 'Relationship Manager',
        role: 'user'
      }
    });

    console.log('✅ Created RM user:', rm.email);

    // Create sample cases
    const sampleCases = [
      {
        clientType: 'corporate',
        clientName: 'ABC Trading Limited',
        dateOfIncorporation: new Date('2020-01-15'),
        country: 'Hong Kong',
        nationality: 'Hong Kong',
        businessType: 'Trading',
        industry: 'Import/Export',
        sourceOfWealth: 'Business profits from international trading',
        status: 'pending',
        rmId: rm.id
      },
      {
        clientType: 'individual',
        clientName: 'John Smith',
        dateOfBirth: new Date('1980-05-20'),
        country: 'United Kingdom',
        nationality: 'British',
        businessType: 'Professional',
        industry: 'Finance',
        sourceOfWealth: 'Employment income and investments',
        status: 'pending',
        rmId: rm.id
      },
      {
        clientType: 'corporate',
        clientName: 'Tech Innovations Ltd',
        dateOfIncorporation: new Date('2019-03-10'),
        country: 'Singapore',
        nationality: 'Singapore',
        businessType: 'Technology',
        industry: 'Software Development',
        sourceOfWealth: 'Software licensing and consulting services',
        status: 'in_review',
        riskScore: 2,
        rmId: rm.id
      }
    ];

    for (const caseData of sampleCases) {
      const existingCase = await prisma.case.findFirst({
        where: { clientName: caseData.clientName }
      });

      if (!existingCase) {
        const createdCase = await prisma.case.create({
          data: caseData
        });
        console.log('✅ Created sample case:', createdCase.clientName);

        // Create sample AI summary for the third case
        if (caseData.clientName === 'Tech Innovations Ltd') {
          await prisma.aiSummary.create({
            data: {
              caseId: createdCase.id,
              riskScore: 2,
              summary: 'Singapore-based technology company with a clean corporate structure. No adverse media findings. Established track record in software development with reputable clients.',
              redFlags: [],
              missingInfo: ['Expected monthly transaction volume', 'List of major clients'],
              recommendation: 'Proceed with onboarding as Low-Medium Risk. Request additional information on transaction patterns and major clients for documentation purposes.',
              modelUsed: 'llama2'
            }
          });
          console.log('✅ Created AI summary for:', createdCase.clientName);
        }
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: password');
    console.log('\n   Email: rm@example.com');
    console.log('   Password: password');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
