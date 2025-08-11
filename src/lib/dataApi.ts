// NOTE: Relaxed typings to avoid union conflicts with App.tsx's own types.
import { supabase, BUCKET } from './supabaseClient'

type Attachment = { name: string; size: number; url?: string }

const toDb = (p: any) => ({
  id: p.id, title: p.title, department: p.department, sponsor: p.sponsor ?? null, type: p.type,
  impact: p.impact, effort: p.effort, description: p.description ?? null,
  cost_sar: p.costSAR ?? null, expected_savings_sar: p.expectedSavingsSAR ?? null,
  attachments: p.attachments ?? [], status: p.status, completion_pct: p.completionPct,
  created_at: new Date(p.createdAt).toISOString(),
})
const fromDb = (r: any): any => ({
  id: r.id, title: r.title, department: r.department, sponsor: r.sponsor ?? undefined, type: r.type,
  impact: r.impact, effort: r.effort, description: r.description ?? undefined,
  costSAR: r.cost_sar ?? undefined, expectedSavingsSAR: r.expected_savings_sar ?? undefined,
  attachments: (r.attachments ?? []) as Attachment[], status: r.status,
  completionPct: r.completion_pct ?? 0, createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
})

export async function fetchProjects(): Promise<any[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (error) throw error; return (data ?? []).map(fromDb)
}
export async function upsertProject(p: any): Promise<void> {
  const { error } = await supabase.from('projects').upsert(toDb(p)); if (error) throw error
}

export async function fetchIdeas(): Promise<any[]> {
  const { data, error } = await supabase.from('ideas').select('*').order('created_at', { ascending: false })
  if (error) throw error; return (data ?? []).map((r: any) => ({
    id: r.id, title: r.title, owner: r.owner ?? undefined, department: r.department ?? undefined,
    benefitNote: r.benefit_note ?? undefined, effortNote: r.effort_note ?? undefined, stage: r.stage
  }))
}
export async function upsertIdea(i: any): Promise<void> {
  const { error } = await supabase.from('ideas').upsert({
    id: i.id, title: i.title, owner: i.owner ?? null, department: i.department ?? null,
    benefit_note: i.benefitNote ?? null, effort_note: i.effortNote ?? null, stage: i.stage
  }); if (error) throw error
}
export async function deleteIdea(id: string): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', id); if (error) throw error
}

export async function uploadAttachment(file: File, pathPrefix: 'projects'|'templates'='projects'): Promise<Attachment> {
  const objectName = `${pathPrefix}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(objectName, file, { upsert: true }); if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
  return { name: objectName.split('/').pop()!, size: file.size, url: data.publicUrl }
}

export async function listTemplates(): Promise<Attachment[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list('templates', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw error
  return (data ?? []).map((o:any) => {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`templates/${o.name}`)
    return { name: o.name, size: o.metadata?.size ?? 0, url: pub.publicUrl }
  })
}
export async function uploadTemplate(file: File): Promise<Attachment> {
  const objectName = `templates/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(objectName, file, { upsert: true }); if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
  return { name: objectName.split('/').pop()!, size: file.size, url: data.publicUrl }
}
export async function deleteTemplate(objectName: string): Promise<void> {
  const path = `templates/${objectName}`
  const { error } = await supabase.storage.from(BUCKET).remove([path]); if (error) throw error
}
