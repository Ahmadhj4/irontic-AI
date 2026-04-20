import { NextResponse } from "next/server";

const ROLE_ENV: Record<string, { email: string | undefined; password: string | undefined }> = {
  admin:             { email: process.env.DEMO_ADMIN_EMAIL,     password: process.env.DEMO_ADMIN_PASSWORD     },
  soc:               { email: process.env.DEMO_SOC_EMAIL,       password: process.env.DEMO_SOC_PASSWORD       },
  soc_lead:          { email: process.env.DEMO_SOC_LEAD_EMAIL,  password: process.env.DEMO_SOC_LEAD_PASSWORD  },
  grc_analyst:       { email: process.env.DEMO_GRC_EMAIL,       password: process.env.DEMO_GRC_PASSWORD       },
  pentester:         { email: process.env.DEMO_PENTESTER_EMAIL, password: process.env.DEMO_PENTESTER_PASSWORD },
  security_engineer: { email: process.env.DEMO_ENGINEER_EMAIL,  password: process.env.DEMO_ENGINEER_PASSWORD  },
  executive:         { email: process.env.DEMO_EXECUTIVE_EMAIL, password: process.env.DEMO_EXECUTIVE_PASSWORD },
};

export async function POST(req: Request) {
  let role: string;
  try {
    ({ role } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const creds = ROLE_ENV[role];
  if (!creds || !creds.email || !creds.password) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  return NextResponse.json({ email: creds.email, password: creds.password });
}
