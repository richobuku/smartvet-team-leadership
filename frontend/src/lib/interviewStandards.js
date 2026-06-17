// Mirrors backend/src/lib/interviewStandards.ts — keep in sync.

export const INTERVIEW_CRITERIA = {
  ey: [
    {
      key: "building_relationships",
      label: "Building Relationships",
      description: "Builds trust and rapport; works effectively with clients, colleagues, and stakeholders.",
      questions: [
        "Tell me about a time you built a strong working relationship with someone who was initially difficult to work with.",
        "Describe a situation where you had to earn the trust of a client or stakeholder quickly. What did you do?",
        "Give an example of how you've maintained a relationship under pressure or disagreement.",
      ],
    },
    {
      key: "drive_quality",
      label: "Drive for Quality",
      description: "Sets high standards and consistently delivers accurate, reliable, high-quality work.",
      questions: [
        "Describe a time you identified an error or quality issue in your own or someone else's work. What did you do?",
        "Tell me about a project where you went beyond what was asked to ensure the outcome was excellent.",
        "How do you check your own work for accuracy when working under tight deadlines?",
      ],
    },
    {
      key: "problem_solving",
      label: "Problem Solving",
      description: "Analyzes information from multiple sources and develops practical, well-reasoned solutions.",
      questions: [
        "Walk me through a complex problem you solved. How did you break it down?",
        "Tell me about a time you had incomplete information but still needed to make a recommendation.",
        "Describe a situation where your first solution didn't work. What did you do next?",
      ],
    },
    {
      key: "agility_innovation",
      label: "Agility & Innovation",
      description: "Adapts quickly to change, ambiguity, or new information, and brings fresh ideas.",
      questions: [
        "Tell me about a time priorities changed suddenly. How did you adjust?",
        "Describe a new idea or approach you introduced that improved how something was done.",
        "Give an example of learning a new tool, process, or skill quickly to meet a need.",
      ],
    },
    {
      key: "teaming",
      label: "Teaming",
      description: "Collaborates effectively and contributes to a high-performing, inclusive team.",
      questions: [
        "Tell me about a time you helped a struggling team member or stepped in to support the team.",
        "Describe your role in a successful team project. What did you specifically contribute?",
        "Give an example of resolving a disagreement within a team you were part of.",
      ],
    },
  ],
  mckinsey: [
    {
      key: "problem_solving",
      label: "Problem Solving",
      description: "Structures ambiguous problems, reasons through them logically, and uses data to drive decisions.",
      questions: [
        "Describe the most complex problem you've tackled. How did you structure your approach?",
        "Tell me about a time you used data to challenge an assumption or change a decision.",
        "Walk me through a time you had to prioritize among several competing problems at once.",
      ],
    },
    {
      key: "personal_impact",
      label: "Personal Impact",
      description: "Communicates persuasively, builds buy-in, and influences outcomes even without formal authority.",
      questions: [
        "Tell me about a time you had to convince a skeptical audience to support your idea.",
        "Describe a situation where you had to deliver a difficult message. How did you approach it?",
        "Give an example of influencing someone more senior than you to change their mind.",
      ],
    },
    {
      key: "leadership",
      label: "Leadership",
      description: "Takes initiative, sets direction, and mobilizes others toward a shared goal.",
      questions: [
        "Tell me about a time you led a team or project through a significant challenge.",
        "Describe a situation where you took ownership of something that wasn't formally your responsibility.",
        "Give an example of motivating a team that was losing momentum.",
      ],
    },
    {
      key: "entrepreneurial_drive",
      label: "Entrepreneurial Drive",
      description: "Shows ambition, ownership, and resilience; pursues goals despite setbacks.",
      questions: [
        "Tell me about a goal you set for yourself that required significant effort over time.",
        "Describe a setback or failure and how you responded to it.",
        "Give an example of identifying an opportunity that others had missed and acting on it.",
      ],
    },
  ],
};

export const RATING_SCALE = [
  { value: 1, label: "Significant concerns", description: "Little to no evidence of this competency; multiple red flags." },
  { value: 2, label: "Below expectations", description: "Limited evidence; would need significant development." },
  { value: 3, label: "Meets expectations", description: "Solid evidence of this competency at the level required for the role." },
  { value: 4, label: "Strong evidence", description: "Clear, well-articulated examples that exceed the bar for this role." },
  { value: 5, label: "Outstanding", description: "Exceptional, standout evidence — among the best the panelist has seen." },
];

export const STANDARD_LABELS = {
  ey: "EY",
  mckinsey: "McKinsey",
};

export const PANEL_DECISION_LABELS = {
  pending: "Pending",
  strong_yes: "Strong Yes",
  yes: "Yes",
  no: "No",
  strong_no: "Strong No",
};

export const PANEL_DECISION_DESCRIPTIONS = {
  strong_yes: "Exceptional candidate — clear hire, among the strongest seen for this role.",
  yes: "Solid candidate — meets the bar for this role, recommend proceeding.",
  no: "Does not meet the bar for this role at this time.",
  strong_no: "Significant concerns — would not recommend this candidate for any role currently open.",
};

export const PANEL_DECISION_OPTIONS = ["strong_yes", "yes", "no", "strong_no"];

export const PANEL_STATUS_LABELS = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
};

export const BINDER_STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};
