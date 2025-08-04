import { createCMSContent } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function seedData() {
  'use server';
  
  const sampleContent = [
    {
      title: "Express Entry System",
      slug: "express-entry-system",
      content: "Express Entry is Canada's main immigration system for skilled workers. It manages applications for three federal economic immigration programs: Federal Skilled Worker Program (FSWP), Canadian Experience Class (CEC), and Federal Skilled Trades Program (FSTP). Candidates must meet eligibility requirements and create an online profile.",
      type: "document" as const,
      category: "Immigration Programs",
      tags: ["express entry", "skilled worker", "immigration", "canada"],
    },
    {
      title: "Provincial Nominee Program (PNP)",
      slug: "provincial-nominee-program",
      content: "The Provincial Nominee Program (PNP) allows Canadian provinces and territories to nominate individuals who wish to immigrate to Canada and who are interested in settling in a particular province. Each province has its own criteria and application process.",
      type: "document" as const,
      category: "Immigration Programs", 
      tags: ["pnp", "provinces", "nomination", "immigration"],
    },
    {
      title: "Language Requirements IELTS",
      slug: "language-requirements-ielts",
      content: "IELTS (International English Language Testing System) is one of the approved language tests for Canadian immigration. Minimum scores vary by program: Express Entry requires CLB 7 (IELTS 6.0) for Federal Skilled Worker, CLB 5 for Canadian Experience Class. Test results are valid for 2 years.",
      type: "document" as const,
      category: "Requirements",
      tags: ["ielts", "language", "english", "requirements", "clb"],
    }
  ];

  try {
    for (const content of sampleContent) {
      await createCMSContent(content);
    }
    console.log("Sample content created successfully!");
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

export default function SeedPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Seed Test Data</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Sample CMS Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will create sample content about Canadian immigration to test the RAG system.
          </p>
          <form action={seedData}>
            <Button type="submit">
              Seed Sample Content
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}