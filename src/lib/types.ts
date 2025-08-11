export type Attachment = { name: string; size: number; url?: string }

export type Project = {
  id: string
  title: string
  department: string
  sponsor?: string
  type: string
  impact: 'Low' | 'Medium' | 'High'
  effort: 'Low' | 'Medium' | 'High'
  description?: string
  costSAR?: number
  expectedSavingsSAR?: number
  attachments: Attachment[]
  status: 'Requested' | 'Approved' | 'In Progress' | 'On Hold' | 'Completed'
  completionPct: number
  createdAt: number
}

export type Idea = {
  id: string
  title: string
  owner?: string
  department?: string
  benefitNote?: string
  effortNote?: string
  stage: 'To Evaluate' | 'Under Review' | 'Ready for Priority'
}
