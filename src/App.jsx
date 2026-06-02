import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react'

import { sampleProjects } from './data/sampleProjects'

const STORAGE_KEY = 'situation-room-projects-v1'

const initiativeOptions = [
  'cloud computing',
  'data',
  'ai',
  'on demand',
  'staff augmentation',
  'team augmentation',
]

const healthOptions = ['Verde', 'Amarillo', 'Rojo']
const controlToneOptions = ['Estable', 'Seguimiento', 'Alerta']

const healthClasses = {
  Verde: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Amarillo: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  Rojo: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
}

const healthDotClasses = {
  Verde: 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.22)]',
  Amarillo: 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.22)]',
  Rojo: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.22)]',
}

const controlToneCardClasses = {
  Estable: 'border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0.78))]',
  Seguimiento: 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.78))]',
  Alerta: 'border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.92),rgba(255,255,255,0.78))]',
}

const controlToneTextClasses = {
  Estable: 'text-emerald-700',
  Seguimiento: 'text-amber-700',
  Alerta: 'text-rose-700',
}

const legacyInitiativeMap = {
  AI: 'ai',
  'Smart Endpoints': 'cloud computing',
  'Webflow Website': 'on demand',
  'Wordpress Website': 'on demand',
  'Team Augmentation': 'team augmentation',
  'Staff Augmentation': 'staff augmentation',
  Otro: 'on demand',
}

const splitTags = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const inferTechnologies = (initiativeType) => {
  const mapped = legacyInitiativeMap[initiativeType] || initiativeType

  if (mapped === 'ai') {
    return ['OpenAI', 'Zendesk', 'Prompting']
  }

  if (mapped === 'cloud computing') {
    return ['APIs', 'Middleware', 'Observability']
  }

  if (mapped === 'on demand') {
    return ['Webflow', 'WordPress', 'CMS']
  }

  return []
}

const emptyProject = () => {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    name: 'Nuevo proyecto',
    client: '',
    initiativeType: 'on demand',
    health: 'Verde',
    description: '',
    startDate: '',
    endDate: '',
    nextMilestone: '',
    nextMilestoneDate: '',
    pmResponsible: '',
    pmBackup: '',
    mainRisk: '',
    assignedPeople: '',
    assignedPeopleLabels: [],
    technologiesUsed: [],
    lastUpdated: now,
    quickComments: '',
    controlSummary: '',
    controlTone: 'Estable',
    clientContact: {
      name: '',
      title: '',
      email: '',
      chat: '',
    },
    teamAssigned: [{ id: crypto.randomUUID(), role: '', name: '', dedication: '' }],
    currentObjective: '',
    importantMeetings: [{ id: crypto.randomUUID(), title: '', date: '', participants: '', objective: '' }],
    alertsAndRisks: '',
    openDecisions: '',
    replacementWatch: '',
    internalComments: '',
    commentLog: [],
  }
}

const normalizeProject = (project) => {
  const base = emptyProject()
  const mappedType = legacyInitiativeMap[project.initiativeType] || project.initiativeType || base.initiativeType
  const assignedPeopleLabels =
    Array.isArray(project.assignedPeopleLabels) && project.assignedPeopleLabels.length
      ? project.assignedPeopleLabels
      : splitTags(project.assignedPeople)
  const technologiesUsed =
    Array.isArray(project.technologiesUsed) && project.technologiesUsed.length
      ? project.technologiesUsed
      : inferTechnologies(project.initiativeType)
  const importantMeetings =
    Array.isArray(project.importantMeetings) && project.importantMeetings.length
      ? project.importantMeetings
      : project.nextMeeting && (project.nextMeeting.date || project.nextMeeting.participants || project.nextMeeting.objective)
        ? [
            {
              id: crypto.randomUUID(),
              title: 'Reunion clave',
              date: project.nextMeeting.date || '',
              participants: project.nextMeeting.participants || '',
              objective: project.nextMeeting.objective || '',
            },
          ]
        : base.importantMeetings

  return {
    ...base,
    ...project,
    initiativeType: initiativeOptions.includes(mappedType) ? mappedType : base.initiativeType,
    description: project.description || project.quickComments || project.currentObjective || '',
    startDate: project.startDate || '',
    endDate: project.endDate || project.nextMilestoneDate || '',
    controlSummary: project.controlSummary || project.quickComments || '',
    controlTone: controlToneOptions.includes(project.controlTone) ? project.controlTone : base.controlTone,
    assignedPeopleLabels,
    technologiesUsed,
    importantMeetings,
    clientContact: {
      ...base.clientContact,
      ...project.clientContact,
    },
    teamAssigned: Array.isArray(project.teamAssigned) && project.teamAssigned.length ? project.teamAssigned : base.teamAssigned,
    commentLog: Array.isArray(project.commentLog) ? project.commentLog : [],
  }
}

const parseStoredProjects = () => {
  if (typeof window === 'undefined') {
    return sampleProjects.map(normalizeProject)
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return sampleProjects.map(normalizeProject)
  }

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed.projects) ? parsed.projects.map(normalizeProject) : sampleProjects.map(normalizeProject)
  } catch {
    return sampleProjects.map(normalizeProject)
  }
}

const formatDate = (value, options = {}) => {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    ...options,
  }).format(date)
}

const sortProjectsByMilestone = (projects) =>
  [...projects].sort((left, right) => {
    const leftTime = left.nextMilestoneDate ? new Date(left.nextMilestoneDate).getTime() : Number.MAX_SAFE_INTEGER
    const rightTime = right.nextMilestoneDate ? new Date(right.nextMilestoneDate).getTime() : Number.MAX_SAFE_INTEGER
    return leftTime - rightTime
  })

function App() {
  const [projects, setProjects] = useState(parseStoredProjects)
  const [selectedProjectId, setSelectedProjectId] = useState(() => sampleProjects[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState('portfolio')
  const [isDossierClosing, setIsDossierClosing] = useState(false)
  const [healthFilter, setHealthFilter] = useState('Todos')
  const [initiativeFilter, setInitiativeFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingComment, setPendingComment] = useState('')
  const dossierCloseTimeoutRef = useRef(null)
  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        projects,
      }),
    )
  }, [projects])

  useEffect(() => {
    document.body.style.overflow = activeTab === 'detail' ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeTab])

  useEffect(() => {
    return () => {
      if (dossierCloseTimeoutRef.current) {
        window.clearTimeout(dossierCloseTimeoutRef.current)
      }
    }
  }, [])

  const activeSelectedProjectId =
    projects.find((project) => project.id === selectedProjectId)?.id ?? projects[0]?.id ?? ''

  const selectedProject = projects.find((project) => project.id === activeSelectedProjectId) ?? null
  const isDossierOpen = activeTab === 'detail' && selectedProject

  const filteredProjects = sortProjectsByMilestone(
    projects.filter((project) => {
      const matchesHealth = healthFilter === 'Todos' || project.health === healthFilter
      const matchesInitiative = initiativeFilter === 'Todos' || project.initiativeType === initiativeFilter
      const normalizedSearch = deferredSearch.trim().toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.client.toLowerCase().includes(normalizedSearch)

      return matchesHealth && matchesInitiative && matchesSearch
    }),
  )

  const summary = healthOptions.reduce(
    (accumulator, item) => ({
      ...accumulator,
      [item]: projects.filter((project) => project.health === item).length,
    }),
    {},
  )

  const updateProject = (projectId, updater) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project
        }

        const nextProject = typeof updater === 'function' ? updater(project) : updater
        return { ...nextProject, lastUpdated: new Date().toISOString() }
      }),
    )
  }

  const updateField = (projectId, field, value) => {
    updateProject(projectId, (project) => ({ ...project, [field]: value }))
  }

  const updateNestedField = (projectId, field, key, value) => {
    updateProject(projectId, (project) => ({
      ...project,
      [field]: {
        ...project[field],
        [key]: value,
      },
    }))
  }

  const updateListItem = (projectId, listName, itemId, field, value) => {
    updateProject(projectId, (project) => ({
      ...project,
      [listName]: project[listName].map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }))
  }

  const addListItem = (projectId, listName, template) => {
    updateProject(projectId, (project) => ({
      ...project,
      [listName]: [...project[listName], { id: crypto.randomUUID(), ...template }],
    }))
  }

  const removeListItem = (projectId, listName, itemId) => {
    updateProject(projectId, (project) => ({
      ...project,
      [listName]: project[listName].filter((item) => item.id !== itemId),
    }))
  }

  const addTagItem = (projectId, fieldName, value) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      return
    }

    updateProject(projectId, (project) => ({
      ...project,
      [fieldName]: [...new Set([...(project[fieldName] || []), normalizedValue])],
    }))
  }

  const removeTagItem = (projectId, fieldName, value) => {
    updateProject(projectId, (project) => ({
      ...project,
      [fieldName]: (project[fieldName] || []).filter((item) => item !== value),
    }))
  }

  const addProject = () => {
    const project = emptyProject()
    setProjects((currentProjects) => sortProjectsByMilestone([project, ...currentProjects]))
    setSelectedProjectId(project.id)
    setIsDossierClosing(false)
    setActiveTab('detail')
  }

  const addComment = () => {
    if (!selectedProject || !pendingComment.trim()) {
      return
    }

    updateProject(selectedProject.id, (project) => ({
      ...project,
      commentLog: [
        {
          id: crypto.randomUUID(),
          message: pendingComment.trim(),
          createdAt: new Date().toISOString(),
          resolved: false,
        },
        ...project.commentLog,
      ],
    }))
    setPendingComment('')
  }

  const toggleCommentResolved = (projectId, commentId) => {
    updateProject(projectId, (project) => ({
      ...project,
      commentLog: project.commentLog.map((comment) =>
        comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment,
      ),
    }))
  }

  const openProjectDossier = (projectId) => {
    if (dossierCloseTimeoutRef.current) {
      window.clearTimeout(dossierCloseTimeoutRef.current)
    }

    setIsDossierClosing(false)
    setSelectedProjectId(projectId)
    setActiveTab('detail')
  }

  const closeProjectDossier = () => {
    if (isDossierClosing) {
      return
    }

    setIsDossierClosing(true)
    dossierCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveTab('portfolio')
      setIsDossierClosing(false)
    }, 220)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,217,255,0.95),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(2,59,253,0.16),_transparent_34%),linear-gradient(180deg,_#f8fbff_0%,_#eaf2ff_50%,_#dceaff_100%)] text-slate-900">
      <div
        className={`app-shell mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 ${
          isDossierOpen ? 'app-shell-frosted' : ''
        }`}
      >
        <header className="glass-panel mb-6 flex flex-col gap-5 rounded-[2rem] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.35em] text-[#023BFD]/70">Situation Room</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#000083] sm:text-4xl">
                Mapa de Compromisos
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
                Vista ejecutiva y ficha operativa AI, On Demand, Staff y TA - Jaime N.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="action-button action-button-primary" type="button" onClick={addProject}>
                Nuevo proyecto
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <TabButton active={activeTab === 'portfolio'} label="Portafolio" onClick={() => setActiveTab('portfolio')} />
            {activeTab === 'detail' && selectedProject ? (
              <TabButton
                active
                label={`Dossier: ${selectedProject.name}`}
                onClick={() => setActiveTab('detail')}
              />
            ) : null}
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Verdes" value={summary.Verde ?? 0} tone="Verde" helper="Ritmo estable y bajo riesgo inmediato." />
          <SummaryCard
            label="Amarillos"
            value={summary.Amarillo ?? 0}
            tone="Amarillo"
            helper="Necesitan seguimiento o desbloqueos esta semana."
          />
          <SummaryCard label="Rojos" value={summary.Rojo ?? 0} tone="Rojo" helper="Atencion ejecutiva y plan de contencion." />
        </section>

        <main className="flex flex-1 flex-col gap-6">
          <section className="flex flex-col">
            <PortfolioPanel
              projects={filteredProjects}
              selectedProjectId={activeSelectedProjectId}
              healthFilter={healthFilter}
              initiativeFilter={initiativeFilter}
              searchQuery={searchQuery}
              setHealthFilter={(value) => setHealthFilter(value)}
              setInitiativeFilter={(value) => setInitiativeFilter(value)}
              setSearchQuery={(value) => {
                startTransition(() => {
                  setSearchQuery(value)
                })
              }}
              onOpenDetail={openProjectDossier}
            />
          </section>
        </main>
      </div>

      {isDossierOpen ? (
        <DossierModal
          project={selectedProject}
          isClosing={isDossierClosing}
          onClose={closeProjectDossier}
          onFieldChange={updateField}
          onNestedFieldChange={updateNestedField}
          onListItemChange={updateListItem}
          onAddListItem={addListItem}
          onRemoveListItem={removeListItem}
          onAddTagItem={addTagItem}
          onRemoveTagItem={removeTagItem}
          pendingComment={pendingComment}
          setPendingComment={setPendingComment}
          onAddComment={addComment}
          onToggleCommentResolved={toggleCommentResolved}
        />
      ) : null}
    </div>
  )
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-[#023BFD] text-white shadow-lg shadow-blue-300/40'
          : 'bg-white/70 text-[#000083] ring-1 ring-inset ring-[#bfd9ff] hover:bg-white'
      }`}
    >
      {label}
    </button>
  )
}

function SummaryCard({ label, value, tone, helper }) {
  return (
    <article className="glass-panel rounded-[1.75rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#000083]/58">{label}</p>
          <p className="mt-3 text-4xl font-semibold text-[#000083]">{value}</p>
        </div>
        <HealthBadge health={tone} />
      </div>
      <p className="text-sm leading-6 text-slate-700">{helper}</p>
    </article>
  )
}

function PortfolioPanel({
  projects,
  selectedProjectId,
  healthFilter,
  initiativeFilter,
  searchQuery,
  setHealthFilter,
  setInitiativeFilter,
  setSearchQuery,
  onOpenDetail,
}) {
  return (
    <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#000083]">Portafolio activo</h2>
          <p className="mt-2 text-sm text-slate-700">
            Home muestra solo el portafolio. Cada proyecto abre su dossier en una vista aparte.
          </p>
        </div>
        <div className="rounded-full bg-[#bfd9ff]/55 px-4 py-2 text-sm font-medium text-[#000083]">
          {projects.length} proyectos visibles
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <label className="field-shell">
          <span className="field-label">Buscar</span>
          <input
            className="field-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Proyecto o cliente"
          />
        </label>

        <label className="field-shell">
          <span className="field-label">Salud</span>
          <select className="field-input" value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
            <option>Todos</option>
            {healthOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span className="field-label">Tipo de iniciativa</span>
          <select
            className="field-input"
            value={initiativeFilter}
            onChange={(event) => setInitiativeFilter(event.target.value)}
          >
            <option>Todos</option>
            {initiativeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <PortfolioProjectCard
            key={project.id}
            project={project}
            isSelected={selectedProjectId === project.id}
            onOpenDetail={() => onOpenDetail(project.id)}
          />
        ))}
      </div>

      {!projects.length ? (
        <div className="rounded-[1.5rem] border border-dashed border-[#bfd9ff] bg-white/55 px-6 py-12 text-center text-sm text-slate-600">
          No hay proyectos que coincidan con los filtros actuales.
        </div>
      ) : null}
    </div>
  )
}

function PortfolioProjectCard({ project, isSelected, onOpenDetail }) {
  return (
    <article
      className={`overflow-hidden rounded-[1.85rem] border transition ${
        isSelected
          ? 'border-[#023BFD]/32 bg-[linear-gradient(135deg,rgba(2,59,253,0.12),rgba(255,255,255,0.92)_32%,rgba(191,217,255,0.34)_100%)] shadow-[0_20px_44px_rgba(2,59,253,0.12)]'
          : 'border-[#bfd9ff] bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(248,251,255,0.84)_52%,rgba(233,242,255,0.74)_100%)] hover:border-[#023BFD]/28 hover:bg-white'
      }`}
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_220px]">
        <div className="min-w-0 border-b border-[#bfd9ff]/75 p-4 xl:border-b-0 xl:border-r">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <HealthBadge health={project.health} />
            <span className="rounded-full bg-[#bfd9ff]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#000083]">
              {project.initiativeType}
            </span>
            <span className="rounded-full bg-white/76 px-3 py-1 text-[11px] font-medium text-[#294b91] ring-1 ring-inset ring-[#bfd9ff]">
              {project.nextMilestoneDate ? formatDate(project.nextMilestoneDate) : 'Sin fecha'}
            </span>
          </div>
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="font-display text-[1.65rem] leading-tight text-[#000083]">{project.name}</h3>
              <p className="mt-0.5 text-sm font-medium text-slate-700">{project.client}</p>
            </div>
            <button
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                isSelected ? 'bg-[#000083] text-white' : 'bg-[#023BFD] text-white hover:bg-[#1054FF]'
              }`}
              type="button"
              onClick={onOpenDetail}
            >
              Abrir dossier
            </button>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <CompactFact label="Main PM" value={project.pmResponsible || 'Sin PM'} />
            <CompactFact label="Backup PM" value={project.pmBackup || 'Sin backup'} />
            <CompactFact label="Fecha inicio" value={project.startDate ? formatDate(project.startDate) : 'Pendiente'} />
            <CompactFact label="Fecha fin" value={project.endDate ? formatDate(project.endDate) : 'Pendiente'} />
          </div>
        </div>

        <div className="min-w-0 border-b border-[#bfd9ff]/75 p-4 xl:border-b-0 xl:border-r">
          <div className="space-y-2.5">
            <LabelCluster
              label="Personal asignado"
              items={project.assignedPeopleLabels?.length ? project.assignedPeopleLabels : ['Sin asignacion']}
            />
            <LabelCluster
              label="Tecnologias"
              items={project.technologiesUsed?.length ? project.technologiesUsed : ['Por definir']}
              subtle
            />
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-2.5 p-4">
          <div className={`rounded-[1.2rem] border p-3.5 ${controlToneCardClasses[project.controlTone] || controlToneCardClasses.Estable}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#023BFD]/68">Control</p>
            <p className={`mt-2 text-[1.7rem] font-semibold leading-none ${controlToneTextClasses[project.controlTone] || controlToneTextClasses.Estable}`}>
              {project.controlTone || 'Estable'}
            </p>
            <p className="mt-1.5 line-clamp-3 text-sm leading-5 text-slate-700">
              {project.controlSummary || 'Sin comentario ejecutivo registrado.'}
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-2.5 border-t border-[#bfd9ff]/75 p-4 xl:col-span-3 xl:grid-cols-2">
          <CompactStrip label="Riesgo principal" value={project.mainRisk || 'Sin riesgo registrado.'} />
          <CompactStrip
            label="Objetivo actual"
            value={project.currentObjective || project.description || 'Sin objetivo actual definido.'}
          />
        </div>
      </div>
    </article>
  )
}

function CompactFact({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-[1.05rem] px-3.5 py-2.5 ring-1 ring-inset ${
        accent
          ? 'bg-[linear-gradient(180deg,rgba(2,59,253,0.10),rgba(255,255,255,0.84))] ring-[#023BFD]/18'
          : 'bg-[#f8fbff]/88 ring-[#bfd9ff]'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">{label}</p>
      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-[#000083]">{value || 'Sin definir'}</p>
    </div>
  )
}

function CompactStrip({ label, value }) {
  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/74 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">{label}</p>
      <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-700">{value}</p>
    </div>
  )
}

function LabelCluster({ label, items, subtle = false }) {
  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/72 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">{label}</p>
      <div className="mt-1.5 flex max-h-[3.4rem] flex-wrap gap-1.5 overflow-hidden">
        {items.slice(0, 8).map((item) => (
          <span
            key={`${label}-${item}`}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              subtle ? 'bg-[#edf4ff] text-[#294b91]' : 'bg-[#dfeaff] text-[#000083]'
            }`}
          >
            {item}
          </span>
        ))}
        {items.length > 8 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">+{items.length - 8}</span>
        ) : null}
      </div>
    </div>
  )
}

function DossierModal({
  project,
  isClosing,
  onClose,
  onFieldChange,
  onNestedFieldChange,
  onListItemChange,
  onAddListItem,
  onRemoveListItem,
  onAddTagItem,
  onRemoveTagItem,
  pendingComment,
  setPendingComment,
  onAddComment,
  onToggleCommentResolved,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 ${
        isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'
      }`}
    >
      <button
        aria-label="Cerrar dossier"
        className="modal-backdrop absolute inset-0"
        type="button"
        onClick={onClose}
      />

      <div className={`modal-shell relative z-10 w-full max-w-5xl ${isClosing ? 'modal-shell-exit' : 'modal-shell-enter'}`}>
        <div className="pointer-events-none absolute inset-x-10 top-0 z-0 h-24 rounded-full bg-[radial-gradient(circle,_rgba(2,59,253,0.18),_rgba(255,255,255,0)_72%)] blur-3xl" />

        <div className="relative z-20 mb-4 flex justify-end">
          <button
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/72 text-2xl leading-none text-[#000083] shadow-[0_18px_45px_rgba(2,59,253,0.16)] backdrop-blur-xl transition hover:bg-white"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-frame relative overflow-hidden rounded-[2.25rem]">
          <div className="dossier-scroll max-h-[calc(100vh-7rem)] overflow-y-auto">
            <ProjectDetailPanel
              project={project}
              onFieldChange={onFieldChange}
              onNestedFieldChange={onNestedFieldChange}
              onListItemChange={onListItemChange}
              onAddListItem={onAddListItem}
              onRemoveListItem={onRemoveListItem}
              onAddTagItem={onAddTagItem}
              onRemoveTagItem={onRemoveTagItem}
              pendingComment={pendingComment}
              setPendingComment={setPendingComment}
              onAddComment={onAddComment}
              onToggleCommentResolved={onToggleCommentResolved}
              modal
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectDetailPanel({
  project,
  onFieldChange,
  onNestedFieldChange,
  onListItemChange,
  onAddListItem,
  onRemoveListItem,
  onAddTagItem,
  onRemoveTagItem,
  pendingComment,
  setPendingComment,
  onAddComment,
  onToggleCommentResolved,
  modal = false,
}) {
  const [personTagDraft, setPersonTagDraft] = useState('')
  const [technologyTagDraft, setTechnologyTagDraft] = useState('')

  return (
    <div
      className={`glass-panel rounded-[2rem] p-5 sm:p-6 ${
        modal
          ? 'border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(243,248,255,0.72))] p-4 shadow-[0_35px_110px_rgba(2,59,253,0.18)] backdrop-blur-[26px] sm:p-5'
          : 'h-full'
      }`}
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-[#bfd9ff] pb-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <HealthBadge health={project.health} />
            <span className="text-xs uppercase tracking-[0.24em] text-[#023BFD]/70">Dossier del proyecto</span>
          </div>
          <h2 className="font-display text-[1.7rem] leading-tight text-[#000083]">{project.name}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-700">
            Ultima actualizacion registrada: {formatDate(project.lastUpdated, { timeStyle: 'short' })}
          </p>
        </div>
        <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/65 px-3.5 py-2.5 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.24em] text-[#023BFD]/70">Cliente</p>
          <p className="mt-1 text-base font-medium text-[#000083]">{project.client || 'Pendiente de definir'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard title="Vista general">
          <div className="grid gap-3 xl:grid-cols-3">
            <InputField label="Nombre del proyecto" value={project.name} onChange={(value) => onFieldChange(project.id, 'name', value)} />
            <InputField label="Cliente" value={project.client} onChange={(value) => onFieldChange(project.id, 'client', value)} />
            <SelectField
              label="Tipo de proyecto"
              value={project.initiativeType}
              options={initiativeOptions}
              onChange={(value) => onFieldChange(project.id, 'initiativeType', value)}
            />
            <SelectField
              label="Estado general / salud"
              value={project.health}
              options={healthOptions}
              onChange={(value) => onFieldChange(project.id, 'health', value)}
            />
            <InputField
              label="Fecha inicio"
              type="date"
              value={project.startDate}
              onChange={(value) => onFieldChange(project.id, 'startDate', value)}
            />
            <InputField
              label="Fecha fin"
              type="date"
              value={project.endDate}
              onChange={(value) => onFieldChange(project.id, 'endDate', value)}
            />
            <InputField
              label="Proximo hito"
              value={project.nextMilestone}
              onChange={(value) => onFieldChange(project.id, 'nextMilestone', value)}
            />
            <InputField
              label="Fecha del hito"
              type="date"
              value={project.nextMilestoneDate}
              onChange={(value) => onFieldChange(project.id, 'nextMilestoneDate', value)}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <TextAreaField
              label="Descripcion"
              value={project.description}
              onChange={(value) => onFieldChange(project.id, 'description', value)}
              rows={3}
            />
            <div className="space-y-2">
              <SelectField
                label="Tono del bloque control"
                value={project.controlTone}
                options={controlToneOptions}
                onChange={(value) => onFieldChange(project.id, 'controlTone', value)}
              />
              <p className="text-xs leading-5 text-slate-500">
                Usa este tono para la lectura ejecutiva, independiente del semaforo operativo.
              </p>
              <TextAreaField
                label="Resumen ejecutivo de control"
                value={project.controlSummary}
                onChange={(value) => onFieldChange(project.id, 'controlSummary', value)}
                rows={2}
              />
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <TagField
              label="Personal asignado"
              value={personTagDraft}
              tags={project.assignedPeopleLabels}
              placeholder="Agregar persona o rol"
              onChange={setPersonTagDraft}
              onAdd={() => {
                onAddTagItem(project.id, 'assignedPeopleLabels', personTagDraft)
                setPersonTagDraft('')
              }}
              onRemove={(tag) => onRemoveTagItem(project.id, 'assignedPeopleLabels', tag)}
            />
            <TagField
              label="Tecnologias utilizadas"
              value={technologyTagDraft}
              tags={project.technologiesUsed}
              placeholder="Agregar tecnologia"
              onChange={setTechnologyTagDraft}
              onAdd={() => {
                onAddTagItem(project.id, 'technologiesUsed', technologyTagDraft)
                setTechnologyTagDraft('')
              }}
              onRemove={(tag) => onRemoveTagItem(project.id, 'technologiesUsed', tag)}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <TextAreaField
              label="Riesgos"
              value={project.mainRisk}
              onChange={(value) => onFieldChange(project.id, 'mainRisk', value)}
              rows={3}
            />
            <TextAreaField
              label="Objetivo actual"
              value={project.currentObjective}
              onChange={(value) => onFieldChange(project.id, 'currentObjective', value)}
              rows={3}
            />
          </div>
        </SectionCard>

        <SectionCard title="Contacto principal del cliente">
          <div className="grid gap-3 md:grid-cols-2">
            <InputField
              label="Nombre"
              value={project.clientContact.name}
              onChange={(value) => onNestedFieldChange(project.id, 'clientContact', 'name', value)}
            />
            <InputField
              label="Cargo"
              value={project.clientContact.title}
              onChange={(value) => onNestedFieldChange(project.id, 'clientContact', 'title', value)}
            />
            <InputField
              label="Email"
              type="email"
              value={project.clientContact.email}
              onChange={(value) => onNestedFieldChange(project.id, 'clientContact', 'email', value)}
            />
            <InputField
              label="WhatsApp"
              value={project.clientContact.chat}
              onChange={(value) => onNestedFieldChange(project.id, 'clientContact', 'chat', value)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Equipo asignado"
          actionLabel="Agregar rol"
          onAction={() => onAddListItem(project.id, 'teamAssigned', { role: '', name: '', dedication: '' })}
        >
          <div className="space-y-2.5">
            {project.teamAssigned.map((member) => (
              <EditableRow
                key={member.id}
                fields={[
                  {
                    label: 'Rol',
                    value: member.role,
                    onChange: (value) => onListItemChange(project.id, 'teamAssigned', member.id, 'role', value),
                  },
                  {
                    label: 'Nombre',
                    value: member.name,
                    onChange: (value) => onListItemChange(project.id, 'teamAssigned', member.id, 'name', value),
                  },
                  {
                    label: 'Dedicacion',
                    value: member.dedication,
                    onChange: (value) => onListItemChange(project.id, 'teamAssigned', member.id, 'dedication', value),
                  },
                ]}
                onRemove={() => onRemoveListItem(project.id, 'teamAssigned', member.id)}
              />
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Alertas y riesgos / decisiones abiertas">
            <div className="grid gap-3 xl:grid-cols-2">
              <TextAreaField
                label="Alertas activas"
                value={project.alertsAndRisks}
                onChange={(value) => onFieldChange(project.id, 'alertsAndRisks', value)}
                rows={4}
              />
              <TextAreaField
                label="Temas por decidir"
                value={project.openDecisions}
                onChange={(value) => onFieldChange(project.id, 'openDecisions', value)}
                rows={4}
              />
            </div>
          </SectionCard>

          <SectionCard title="Reemplazo y reuniones clave">
            <TextAreaField
              label="Vigilancia critica"
              value={project.replacementWatch}
              onChange={(value) => onFieldChange(project.id, 'replacementWatch', value)}
              rows={4}
            />
          </SectionCard>
        </div>

        <SectionCard
          title="Reuniones frecuentes / importantes"
          actionLabel="Agregar reunion"
          onAction={() => onAddListItem(project.id, 'importantMeetings', { title: '', date: '', participants: '', objective: '' })}
        >
          <div className="space-y-2.5">
            {project.importantMeetings.map((meeting) => (
              <EditableRow
                key={meeting.id}
                fields={[
                  {
                    label: 'Reunion',
                    value: meeting.title,
                    onChange: (value) => onListItemChange(project.id, 'importantMeetings', meeting.id, 'title', value),
                  },
                  {
                    label: 'Fecha',
                    type: 'datetime-local',
                    value: meeting.date,
                    onChange: (value) => onListItemChange(project.id, 'importantMeetings', meeting.id, 'date', value),
                  },
                  {
                    label: 'Participantes',
                    value: meeting.participants,
                    onChange: (value) => onListItemChange(project.id, 'importantMeetings', meeting.id, 'participants', value),
                  },
                  {
                    label: 'Objetivo',
                    value: meeting.objective,
                    onChange: (value) => onListItemChange(project.id, 'importantMeetings', meeting.id, 'objective', value),
                  },
                ]}
                columns={4}
                onRemove={() => onRemoveListItem(project.id, 'importantMeetings', meeting.id)}
              />
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <SectionCard title="Comentarios internos">
            <TextAreaField
              label="Notas internas editables"
              value={project.internalComments}
              onChange={(value) => onFieldChange(project.id, 'internalComments', value)}
              rows={5}
            />
          </SectionCard>

          <SectionCard title="Bitacora de comentarios">
            <div className="space-y-2.5">
              <TextAreaField
                label="Nuevo comentario"
                value={pendingComment}
                onChange={setPendingComment}
                rows={3}
                placeholder="Escribe una observacion, decision o alerta operativa..."
              />
              <button className="action-button action-button-primary" type="button" onClick={onAddComment}>
                Agregar comentario
              </button>

              <div className="space-y-2">
                {project.commentLog.map((comment) => (
                  <article
                    key={comment.id}
                    className={`rounded-[0.95rem] border px-3 py-3 text-sm ${
                      comment.resolved
                        ? 'border-emerald-300/50 bg-emerald-50 text-slate-700'
                        : 'border-[#bfd9ff] bg-white/80 text-slate-800'
                    }`}
                  >
                    <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#023BFD]/60">
                        {formatDate(comment.createdAt, { timeStyle: 'short' })}
                      </p>
                      <button
                        className="rounded-full border border-[#bfd9ff] px-2.5 py-1 text-[11px] text-[#000083] transition hover:bg-[#bfd9ff]/35"
                        type="button"
                        onClick={() => onToggleCommentResolved(project.id, comment.id)}
                      >
                        {comment.resolved ? 'Reabrir' : 'Marcar resuelto'}
                      </button>
                    </div>
                    <p className="leading-5">{comment.message}</p>
                  </article>
                ))}

                {!project.commentLog.length ? (
                  <p className="rounded-[0.95rem] border border-dashed border-[#bfd9ff] bg-white/55 px-3 py-4 text-sm text-slate-500">
                    Aun no hay comentarios registrados para este proyecto.
                  </p>
                ) : null}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, children, actionLabel, onAction }) {
  return (
    <section className="rounded-[1.2rem] border border-[#bfd9ff] bg-white/62 p-4 shadow-[0_8px_24px_rgba(16,84,255,0.06)]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-base font-semibold text-[#000083]">{title}</h3>
        {actionLabel ? (
          <button className="action-button w-full sm:w-auto" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function EditableRow({ fields, onRemove, columns = 3 }) {
  const gridClass = columns === 4 ? 'xl:grid-cols-4' : 'md:grid-cols-3'

  return (
    <div className="rounded-[1rem] border border-[#bfd9ff] bg-[#f8fbff] p-3">
      <div className={`grid gap-3 ${gridClass}`}>
        {fields.map((field) => (
          <InputField
            key={field.label}
            label={field.label}
            type={field.type}
            value={field.value}
            onChange={field.onChange}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-700 transition hover:bg-rose-50"
          type="button"
          onClick={onRemove}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

function TagField({ label, tags, value, onChange, onAdd, onRemove, placeholder }) {
  return (
    <div className="field-shell">
      <span className="field-label">{label}</span>
      <div className="rounded-[1rem] border border-[#bfd9ff] bg-white/68 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#bfd9ff] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-[#000083]"
            >
              {tag}
              <button
                className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#bfd9ff]/45 text-[10px] text-[#000083] transition hover:bg-rose-100 hover:text-rose-700"
                type="button"
                onClick={() => onRemove(tag)}
              >
                ×
              </button>
            </span>
          ))}

          {!tags.length ? <span className="text-sm text-slate-500">Aun no hay elementos agregados.</span> : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field-input"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onAdd()
              }
            }}
          />
          <button className="action-button w-full sm:w-auto" type="button" onClick={onAdd}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="field-shell">
      <span className="field-label">{label}</span>
      <input className="field-input" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <label className="field-shell">
      <span className="field-label">{label}</span>
      <textarea
        className="field-input min-h-[7rem] resize-y"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="field-shell">
      <span className="field-label">{label}</span>
      <select className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function HealthBadge({ health }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${healthClasses[health]}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${healthDotClasses[health]}`}></span>
      {health}
    </span>
  )
}

export default App
