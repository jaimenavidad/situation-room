import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react'

import { sampleProjects } from './data/sampleProjects'

const CACHE_KEY = 'situation-room-projects-cache-v1'
const LEGACY_STORAGE_KEY = 'situation-room-projects-v2'
const PROJECTS_GET_ENDPOINT = '/.netlify/functions/projects-get'
const PROJECTS_SAVE_ENDPOINT = '/.netlify/functions/projects-save'
const PROJECTS_PDF_IMPORT_ENDPOINT = '/.netlify/functions/projects-import-pdf'
const SAVE_DEBOUNCE_MS = 600
const THEME_STORAGE_KEY = 'situation-room-theme-mode'

const initiativeOptions = [
  'cloud computing',
  'data',
  'ai',
  'on demand',
  'staff augmentation',
  'team augmentation',
]

const healthOptions = ['Verde', 'Amarillo', 'Rojo']

const healthClasses = {
  Verde: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Amarillo: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  Rojo: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
}

const healthDotClasses = {
  Verde: 'health-dot--green bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.22)]',
  Amarillo: 'health-dot--amber bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.22)]',
  Rojo: 'health-dot--rose bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.22)]',
}

const controlToneCardClasses = {
  Estable: 'border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.92),rgba(255,255,255,0.78))]',
  Seguimiento: 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.78))]',
  Alerta: 'border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.92),rgba(255,255,255,0.78))]',
}

const controlToneChipClasses = {
  Estable: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Seguimiento: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  Alerta: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
}

const healthToControlTone = {
  Verde: 'Estable',
  Amarillo: 'Seguimiento',
  Rojo: 'Alerta',
}

const confidenceToneClasses = {
  Alta: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Media: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  Baja: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
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

const getInitialThemeMode = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

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
    budgetedHours: '',
    currentHours: '',
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
    budgetedHours: project.budgetedHours ?? '',
    currentHours: project.currentHours ?? '',
    controlSummary: project.controlSummary || project.quickComments || '',
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

const parseProjectsFromStorageKey = (storageKey) => {
  if (typeof window === 'undefined') {
    return sampleProjects.map(normalizeProject)
  }

  const saved = window.localStorage.getItem(storageKey)

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

const parseCachedProjects = () => parseProjectsFromStorageKey(CACHE_KEY)
const parseLegacyProjects = () => parseProjectsFromStorageKey(LEGACY_STORAGE_KEY)

const loadProjectsFromRemote = async () => {
  const response = await fetch(PROJECTS_GET_ENDPOINT, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Error cargando proyectos (${response.status})`)
  }

  const payload = await response.json()
  const projects = Array.isArray(payload?.projects) ? payload.projects : []
  return projects.map(normalizeProject)
}

const saveProjectsToRemote = async (projects, options = {}) => {
  const { keepalive = false } = options
  const response = await fetch(PROJECTS_SAVE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    keepalive,
    body: JSON.stringify({ projects }),
  })

  if (!response.ok) {
    throw new Error(`Error guardando proyectos (${response.status})`)
  }

  return response.json()
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo PDF'))
    reader.readAsDataURL(file)
  })

const importProjectPdfFromFile = async (file) => {
  const fileBase64 = await fileToBase64(file)
  const response = await fetch(PROJECTS_PDF_IMPORT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileBase64,
    }),
  })

  if (!response.ok) {
    throw new Error(`Error importando PDF (${response.status})`)
  }

  return response.json()
}

const createImportDraft = (draft = {}) => {
  const base = emptyProject()

  return {
    ...base,
    ...draft,
    name: draft.name || '',
    client: draft.client || '',
    description: draft.description || '',
    startDate: draft.startDate || '',
    endDate: draft.endDate || '',
    budgetedHours: draft.budgetedHours ?? '',
    currentHours: draft.currentHours ?? '',
    nextMilestone: draft.nextMilestone || '',
    nextMilestoneDate: draft.nextMilestoneDate || '',
    controlSummary: draft.controlSummary || '',
    mainRisk: draft.mainRisk || '',
    currentObjective: draft.currentObjective || '',
    technologiesUsed: Array.isArray(draft.technologiesUsed) ? draft.technologiesUsed : [],
    replacementWatch: draft.replacementWatch || '',
    alertsAndRisks: draft.alertsAndRisks || '',
    openDecisions: draft.openDecisions || '',
    internalComments: draft.internalComments || '',
    clientContact: {
      ...base.clientContact,
      ...draft.clientContact,
    },
    teamAssigned: Array.isArray(draft.teamAssigned)
      ? draft.teamAssigned.map((member) => ({
          id: member.id || crypto.randomUUID(),
          role: member.role || '',
          name: member.name || '',
          dedication: member.dedication || '',
        }))
      : [],
    importantMeetings: Array.isArray(draft.importantMeetings)
      ? draft.importantMeetings.map((meeting) => ({
          id: meeting.id || crypto.randomUUID(),
          title: meeting.title || '',
          date: meeting.date || '',
          participants: meeting.participants || '',
          objective: meeting.objective || '',
        }))
      : [],
    commentLog: [],
  }
}

const createProjectFromImportDraft = (draft) => {
  const base = emptyProject()

  return {
    ...base,
    ...draft,
    id: crypto.randomUUID(),
    lastUpdated: new Date().toISOString(),
    name: draft.name || base.name,
    clientContact: {
      ...base.clientContact,
      ...draft.clientContact,
    },
    technologiesUsed: Array.isArray(draft.technologiesUsed) ? draft.technologiesUsed : [],
    teamAssigned: Array.isArray(draft.teamAssigned)
      ? draft.teamAssigned.map((member) => ({
          id: member.id || crypto.randomUUID(),
          role: member.role || '',
          name: member.name || '',
          dedication: member.dedication || '',
        }))
      : [],
    importantMeetings: Array.isArray(draft.importantMeetings)
      ? draft.importantMeetings.map((meeting) => ({
          id: meeting.id || crypto.randomUUID(),
          title: meeting.title || '',
          date: meeting.date || '',
          participants: meeting.participants || '',
          objective: meeting.objective || '',
        }))
      : [],
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

const parseDateAtStartOfDay = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date
}

const formatOccupationValue = (value) => {
  const trimmed = String(value || '').trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.includes('%') ? trimmed : `${trimmed}%`
}

const parseOccupationPercentage = (value) => {
  const match = String(value || '').match(/\d+(?:\.\d+)?/)

  if (!match) {
    return null
  }

  return Number(match[0])
}

const getOccupationSignal = (value) => {
  const percentage = parseOccupationPercentage(value)

  if (percentage === null || Number.isNaN(percentage)) {
    return {
      percentage: 0,
      label: 'Sin dato',
      chipClass: 'bg-slate-100 text-slate-500',
      barClass: 'bg-slate-300',
      trackClass: 'bg-slate-200/80',
    }
  }

  if (percentage <= 39) {
    return {
      percentage,
      label: 'Subutilizado / riesgo de baja asignacion',
      chipClass: 'bg-rose-50 text-rose-700 ring-rose-200',
      barClass: 'bg-rose-500',
      trackClass: 'bg-rose-100',
    }
  }

  if (percentage <= 59) {
    return {
      percentage,
      label: 'Utilizacion baja',
      chipClass: 'bg-orange-50 text-orange-700 ring-orange-200',
      barClass: 'bg-orange-400',
      trackClass: 'bg-orange-100',
    }
  }

  if (percentage <= 74) {
    return {
      percentage,
      label: 'Utilizacion aceptable',
      chipClass: 'bg-amber-50 text-amber-700 ring-amber-200',
      barClass: 'bg-amber-400',
      trackClass: 'bg-amber-100',
    }
  }

  if (percentage <= 89) {
    return {
      percentage,
      label: 'Buena ocupacion',
      chipClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      barClass: 'bg-emerald-400',
      trackClass: 'bg-emerald-100',
    }
  }

  if (percentage <= 100) {
    return {
      percentage,
      label: 'Ocupacion optima',
      chipClass: 'bg-green-50 text-green-700 ring-green-200',
      barClass: 'bg-green-600',
      trackClass: 'bg-green-100',
    }
  }

  if (percentage <= 110) {
    return {
      percentage,
      label: 'Leve sobreasignacion controlada',
      chipClass: 'bg-blue-50 text-blue-700 ring-blue-200',
      barClass: 'bg-blue-500',
      trackClass: 'bg-blue-100',
    }
  }

  return {
    percentage,
    label: 'Sobrecarga / riesgo operativo',
    chipClass: 'bg-purple-50 text-purple-700 ring-purple-200',
    barClass: 'bg-purple-600',
    trackClass: 'bg-purple-100',
  }
}

const formatConsolidatedOccupationValue = (value) => {
  const normalizedValue = Number.isInteger(value) ? value : Number(value.toFixed(1))
  return `${normalizedValue}%`
}

const getPersonnelKey = (name) =>
  String(name || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const buildConsolidatedPersonnel = (projects) => {
  const personnelMap = new Map()

  projects.forEach((project) => {
    project.teamAssigned?.forEach((member) => {
      const name = member.name?.trim()
      const role = member.role?.trim() || 'Rol pendiente'
      const percentage = parseOccupationPercentage(member.dedication) ?? 0

      if (!name) {
        return
      }

      const key = getPersonnelKey(name)
      const current = personnelMap.get(key) || {
        key,
        name,
        totalPercentage: 0,
        assignments: [],
      }

      current.totalPercentage += percentage
      current.assignments.push({
        id: `${project.id}-${role}-${name}-${member.dedication || '0'}`,
        projectName: project.name || 'Proyecto sin nombre',
        role,
        occupation: formatOccupationValue(member.dedication) || '0%',
        signal: getOccupationSignal(member.dedication),
      })

      personnelMap.set(key, current)
    })
  })

  return Array.from(personnelMap.values())
    .map((person) => {
      const totalOccupation = formatConsolidatedOccupationValue(person.totalPercentage)

      return {
        ...person,
        totalOccupation,
        totalSignal: getOccupationSignal(totalOccupation),
      }
    })
    .sort((first, second) => second.totalPercentage - first.totalPercentage || first.name.localeCompare(second.name))
}

const getTimelineProgress = (startDate, endDate, referenceDate = new Date()) => {
  const start = parseDateAtStartOfDay(startDate)
  const end = parseDateAtStartOfDay(endDate)

  if (!start || !end || end.getTime() <= start.getTime()) {
    return {
      percentage: 0,
      tier: 'unscheduled',
      label: 'Sin rango',
      detail: 'Agrega fechas para medir avance',
    }
  }

  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  const startTime = start.getTime()
  const endTime = end.getTime()
  const todayTime = today.getTime()
  const duration = endTime - startTime

  let percentage

  if (todayTime <= startTime) {
    percentage = 0
  } else if (todayTime >= endTime) {
    percentage = 100
  } else {
    percentage = Math.round(((todayTime - startTime) / duration) * 100)
  }

  if (percentage >= 100) {
    return {
      percentage,
      tier: 'complete',
      label: 'Final',
      detail: 'Timeline consumido',
    }
  }

  if (percentage >= 80) {
    return {
      percentage,
      tier: 'late',
      label: 'Late stage',
      detail: 'Cerca del cierre',
    }
  }

  if (percentage >= 50) {
    return {
      percentage,
      tier: 'mid',
      label: 'Midway',
      detail: 'Mitad o mas del tramo',
    }
  }

  return {
    percentage,
    tier: 'early',
    label: 'On track',
    detail: 'Tramo inicial',
  }
}

const getHoursConsumptionProgress = (budgetedHours, currentHours) => {
  const budget = Number(budgetedHours)
  const consumed = Number(currentHours)

  if (!Number.isFinite(budget) || budget <= 0) {
    return {
      percentage: 0,
      tier: 'unscheduled',
      label: 'Sin presupuesto',
      detail: 'Agrega horas presupuestadas',
    }
  }

  const normalizedConsumed = Number.isFinite(consumed) && consumed > 0 ? consumed : 0
  const ratio = normalizedConsumed / budget
  const percentage = Math.max(0, Math.round(Math.min(ratio, 1) * 100))

  if (ratio >= 1) {
    return {
      percentage: 100,
      tier: 'complete',
      label: 'Tope alcanzado',
      detail: `${normalizedConsumed}h de ${budget}h`,
    }
  }

  if (ratio >= 0.8) {
    return {
      percentage,
      tier: 'late',
      label: 'Consumo alto',
      detail: `${normalizedConsumed}h de ${budget}h`,
    }
  }

  if (ratio >= 0.5) {
    return {
      percentage,
      tier: 'mid',
      label: 'Mitad consumida',
      detail: `${normalizedConsumed}h de ${budget}h`,
    }
  }

  return {
    percentage,
    tier: 'early',
    label: 'Consumo sano',
    detail: `${normalizedConsumed}h de ${budget}h`,
  }
}

const getOccupationProgress = (value) => {
  const normalized = String(value || '').replace('%', '').trim()
  const percentage = Number(normalized)

  if (!Number.isFinite(percentage) || percentage <= 0) {
    return {
      percentage: 0,
      tier: 'unscheduled',
      label: 'Sin carga',
      detail: '0%',
    }
  }

  if (percentage >= 100) {
    return {
      percentage: 100,
      tier: 'complete',
      label: 'Full load',
      detail: `${percentage}%`,
    }
  }

  if (percentage >= 80) {
    return {
      percentage,
      tier: 'late',
      label: 'Carga alta',
      detail: `${percentage}%`,
    }
  }

  if (percentage >= 50) {
    return {
      percentage,
      tier: 'mid',
      label: 'Carga media',
      detail: `${percentage}%`,
    }
  }

  return {
    percentage,
    tier: 'early',
    label: 'Carga baja',
    detail: `${percentage}%`,
  }
}

const sortProjectsByMilestone = (projects) =>
  [...projects].sort((left, right) => {
    const leftTime = left.nextMilestoneDate ? new Date(left.nextMilestoneDate).getTime() : Number.MAX_SAFE_INTEGER
    const rightTime = right.nextMilestoneDate ? new Date(right.nextMilestoneDate).getTime() : Number.MAX_SAFE_INTEGER
    return leftTime - rightTime
  })

function App() {
  const [projects, setProjects] = useState(() => parseCachedProjects())
  const [selectedProjectId, setSelectedProjectId] = useState(() => parseCachedProjects()[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState('portfolio')
  const [isDossierClosing, setIsDossierClosing] = useState(false)
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false)
  const [healthFilter, setHealthFilter] = useState('Todos')
  const [initiativeFilter, setInitiativeFilter] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingComment, setPendingComment] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [appNotice, setAppNotice] = useState(null)
  const [themeMode, setThemeMode] = useState(getInitialThemeMode)
  const [pdfImportState, setPdfImportState] = useState({
    fileName: '',
    isParsing: false,
    error: '',
    draft: null,
    confidenceByField: {},
    missingFields: [],
    parserMeta: null,
  })
  const dossierCloseTimeoutRef = useRef(null)
  const noticeTimeoutRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const hasLoadedRemoteRef = useRef(false)
  const hasUserMutatedProjectsRef = useRef(false)
  const projectsRef = useRef(projects)
  const deferredSearch = useDeferredValue(searchQuery)

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)

    return undefined
  }, [themeMode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let isCancelled = false

    const hydrateProjects = async () => {
      try {
        const remoteProjects = await loadProjectsFromRemote()
        const legacyProjects = remoteProjects.length ? [] : parseLegacyProjects()
        const resolvedProjects = remoteProjects.length ? remoteProjects : legacyProjects

        if (isCancelled) {
          return
        }

        setProjects(resolvedProjects)
        setSelectedProjectId((currentId) => {
          if (resolvedProjects.some((project) => project.id === currentId)) {
            return currentId
          }

          return resolvedProjects[0]?.id ?? ''
        })
        window.localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            version: 1,
            savedAt: new Date().toISOString(),
            projects: resolvedProjects,
          }),
        )

        if (!remoteProjects.length && legacyProjects.length) {
          saveProjectsToRemote(legacyProjects).catch((error) => {
            console.error('No se pudieron migrar los proyectos legacy hacia Netlify Blobs.', error)
          })
        }
      } catch (error) {
        console.error('No se pudieron cargar los proyectos desde Netlify Blobs.', error)
      } finally {
        if (!isCancelled) {
          hasLoadedRemoteRef.current = true
          setIsInitialLoading(false)
        }
      }
    }

    hydrateProjects()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        projects,
      }),
    )

    if (!hasLoadedRemoteRef.current || !hasUserMutatedProjectsRef.current) {
      return undefined
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveProjectsToRemote(projects).catch((error) => {
        console.error('No se pudieron guardar los proyectos en Netlify Blobs.', error)
      })
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [projects])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const flushProjects = () => {
      if (!hasLoadedRemoteRef.current || !hasUserMutatedProjectsRef.current) {
        return
      }

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      saveProjectsToRemote(projectsRef.current, { keepalive: true }).catch((error) => {
        console.error('No se pudieron sincronizar los proyectos antes de salir.', error)
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushProjects()
      }
    }

    window.addEventListener('beforeunload', flushProjects)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', flushProjects)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = activeTab === 'detail' || isPdfImportOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeTab, isPdfImportOpen])

  useEffect(() => {
    return () => {
      if (dossierCloseTimeoutRef.current) {
        window.clearTimeout(dossierCloseTimeoutRef.current)
      }

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current)
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
  const consolidatedPersonnel = buildConsolidatedPersonnel(projects)

  const updateProject = (projectId, updater) => {
    hasUserMutatedProjectsRef.current = true
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

  const showAppNotice = (notice) => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current)
    }

    setAppNotice({ id: crypto.randomUUID(), ...notice })
    noticeTimeoutRef.current = window.setTimeout(() => {
      setAppNotice(null)
      noticeTimeoutRef.current = null
    }, 4200)
  }

  const addProject = () => {
    hasUserMutatedProjectsRef.current = true
    const project = emptyProject()
    setProjects((currentProjects) => sortProjectsByMilestone([project, ...currentProjects]))
    setSelectedProjectId(project.id)
    setIsDossierClosing(false)
    setActiveTab('detail')
  }

  const openPdfImport = () => {
    setPdfImportState({
      fileName: '',
      isParsing: false,
      error: '',
      draft: null,
      confidenceByField: {},
      missingFields: [],
      parserMeta: null,
    })
    setIsPdfImportOpen(true)
  }

  const closePdfImport = () => {
    if (pdfImportState.isParsing) {
      return
    }

    setIsPdfImportOpen(false)
  }

  const handlePdfImportFile = async (file) => {
    if (!file) {
      return
    }

    setPdfImportState({
      fileName: file.name,
      isParsing: true,
      error: '',
      draft: null,
      confidenceByField: {},
      missingFields: [],
      parserMeta: null,
    })

    try {
      const payload = await importProjectPdfFromFile(file)
      setPdfImportState({
        fileName: payload.fileName || file.name,
        isParsing: false,
        error: '',
        draft: createImportDraft(payload.projectDraft),
        confidenceByField: payload.confidenceByField || {},
        missingFields: Array.isArray(payload.missingFields) ? payload.missingFields : [],
        parserMeta: payload.parserMeta || null,
      })
    } catch (error) {
      setPdfImportState({
        fileName: file.name,
        isParsing: false,
        error: error instanceof Error ? error.message : 'No se pudo analizar el PDF',
        draft: null,
        confidenceByField: {},
        missingFields: [],
        parserMeta: null,
      })
    }
  }

  const updatePdfImportDraft = (updater) => {
    setPdfImportState((current) => {
      if (!current.draft) {
        return current
      }

      return {
        ...current,
        draft: typeof updater === 'function' ? updater(current.draft) : updater,
      }
    })
  }

  const updatePdfImportField = (field, value) => {
    updatePdfImportDraft((draft) => ({ ...draft, [field]: value }))
  }

  const updatePdfImportNestedField = (field, key, value) => {
    updatePdfImportDraft((draft) => ({
      ...draft,
      [field]: {
        ...draft[field],
        [key]: value,
      },
    }))
  }

  const updatePdfImportListItem = (listName, itemId, field, value) => {
    updatePdfImportDraft((draft) => ({
      ...draft,
      [listName]: draft[listName].map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }))
  }

  const addPdfImportListItem = (listName, template) => {
    updatePdfImportDraft((draft) => ({
      ...draft,
      [listName]: [...draft[listName], { id: crypto.randomUUID(), ...template }],
    }))
  }

  const removePdfImportListItem = (listName, itemId) => {
    updatePdfImportDraft((draft) => ({
      ...draft,
      [listName]: draft[listName].filter((item) => item.id !== itemId),
    }))
  }

  const addPdfImportTag = (fieldName, value) => {
    const normalizedValue = value.trim()

    if (!normalizedValue) {
      return
    }

    updatePdfImportDraft((draft) => ({
      ...draft,
      [fieldName]: [...new Set([...(draft[fieldName] || []), normalizedValue])],
    }))
  }

  const removePdfImportTag = (fieldName, value) => {
    updatePdfImportDraft((draft) => ({
      ...draft,
      [fieldName]: (draft[fieldName] || []).filter((item) => item !== value),
    }))
  }

  const confirmPdfImport = () => {
    if (!pdfImportState.draft) {
      return
    }

    hasUserMutatedProjectsRef.current = true
    const importedProject = createProjectFromImportDraft(pdfImportState.draft)

    setProjects((currentProjects) => sortProjectsByMilestone([importedProject, ...currentProjects]))
    setSelectedProjectId(importedProject.id)
    setIsDossierClosing(false)
    setIsPdfImportOpen(false)
    setActiveTab('portfolio')
    showAppNotice({
      title: 'Proyecto creado',
      message: `${importedProject.name || 'El proyecto importado'} ya esta visible en Portafolio activo.`,
    })
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
    <div className="retro-system-background min-h-screen text-slate-900">
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

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1 rounded-full bg-white/58 p-1 ring-1 ring-inset ring-[#bfd9ff]">
                <TabButton active={activeTab === 'portfolio'} label="Portafolio" onClick={() => setActiveTab('portfolio')} />
                <TabButton active={activeTab === 'detail'} label="Nuevo proyecto" onClick={addProject} />
              </div>
              <button
                className="inline-flex h-9 items-center justify-center rounded-full bg-white/70 px-3.5 text-[13px] font-semibold tracking-[-0.01em] text-[#000083] ring-1 ring-inset ring-[#bfd9ff] transition hover:bg-white"
                type="button"
                onClick={openPdfImport}
              >
                Importar PDF
              </button>
              <ThemeToggleButton themeMode={themeMode} onToggle={() => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))} />
            </div>
          </div>

        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Control" value={summary.Verde ?? 0} tone="Verde" helper="Ritmo estable y bajo riesgo inmediato." />
          <SummaryCard
            label="Seguimiento"
            value={summary.Amarillo ?? 0}
            tone="Amarillo"
            helper="Necesitan seguimiento o desbloqueos esta semana."
          />
          <SummaryCard label="Alerta" value={summary.Rojo ?? 0} tone="Rojo" helper="Atencion ejecutiva y plan de contencion." />
        </section>

        <ConsolidatedPersonnelPanel people={consolidatedPersonnel} />

        <main className="flex flex-1 flex-col gap-6">
          <section className="flex flex-col">
            <PortfolioPanel
              projects={filteredProjects}
              isInitialLoading={isInitialLoading}
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

      {isPdfImportOpen ? (
        <PdfImportModal
          state={pdfImportState}
          onClose={closePdfImport}
          onFileSelected={handlePdfImportFile}
          onFieldChange={updatePdfImportField}
          onNestedFieldChange={updatePdfImportNestedField}
          onListItemChange={updatePdfImportListItem}
          onAddListItem={addPdfImportListItem}
          onRemoveListItem={removePdfImportListItem}
          onAddTagItem={addPdfImportTag}
          onRemoveTagItem={removePdfImportTag}
          onConfirm={confirmPdfImport}
        />
      ) : null}

      {appNotice ? <AppNotice notice={appNotice} onDismiss={() => setAppNotice(null)} /> : null}
    </div>
  )
}

function AppNotice({ notice, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-6 sm:w-full sm:translate-x-0"
      role="status"
    >
      <div className="glass-panel modal-shell-enter rounded-[1.35rem] border-emerald-200/90 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.82))] px-4 py-3 shadow-[0_24px_60px_rgba(2,59,253,0.16)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            ✓
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{notice.title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-700">{notice.message}</p>
          </div>
          <button
            aria-label="Cerrar confirmacion"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-base leading-none text-[#000083] ring-1 ring-inset ring-[#bfd9ff] transition hover:bg-white"
            type="button"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[2.125rem] items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold tracking-[-0.01em] transition ${
        active
          ? 'bg-[#023BFD] text-white shadow-[0_10px_24px_rgba(2,59,253,0.22)]'
          : 'bg-white/70 text-[#000083] ring-1 ring-inset ring-[#bfd9ff] hover:bg-white'
      }`}
    >
      {label}
    </button>
  )
}

function ThemeToggleButton({ themeMode, onToggle }) {
  const isDark = themeMode === 'dark'

  return (
    <button
      aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      className="inline-flex h-9 items-center gap-2 rounded-full bg-white/70 px-3 text-[13px] font-semibold tracking-[-0.01em] text-[#000083] ring-1 ring-inset ring-[#bfd9ff] transition hover:bg-white"
      type="button"
      onClick={onToggle}
    >
      <span
        className={`h-2 w-2 rounded-full shadow-[0_0_14px_rgba(2,59,253,0.22)] ${
          isDark ? 'bg-[#000083]' : 'bg-[#bfd9ff]'
        }`}
      />
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

function SummaryCard({ label, value, tone, helper }) {
  return (
    <article className="glass-panel rounded-[1.5rem] px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#000083]/58">{label}</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-[2.25rem] font-semibold leading-none text-[#000083]">{value}</p>
            <p className="pb-1 text-xs leading-4 text-slate-700">{helper}</p>
          </div>
        </div>
        <HealthBadge health={tone} />
      </div>
    </article>
  )
}

function ConsolidatedPersonnelPanel({ people }) {
  const visiblePeople = people.slice(0, 8)
  const remainingPeople = people.length - visiblePeople.length

  return (
    <section className="glass-panel mb-6 rounded-[1.5rem] px-4 py-3.5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#023BFD]/70">Personal consolidado</p>
          <p className="mt-1 text-xs leading-4 text-slate-600">
            Ocupacion total por persona en el portafolio activo, con desglose por proyecto.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#bfd9ff]/55 px-3 py-1 text-[11px] font-semibold text-[#000083] ring-1 ring-inset ring-[#bfd9ff]">
          {people.length} recursos
        </span>
      </div>

      {visiblePeople.length ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {visiblePeople.map((person) => (
            <ConsolidatedPersonnelCard key={person.key} person={person} />
          ))}
          {remainingPeople > 0 ? (
            <div className="rounded-[1.05rem] border border-dashed border-[#bfd9ff] bg-white/45 px-3 py-2 text-[11px] font-medium text-slate-500">
              +{remainingPeople} recursos adicionales en filtros actuales.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.05rem] border border-dashed border-[#bfd9ff] bg-white/45 px-3 py-4 text-sm text-slate-500">
          No hay personal asignado en los proyectos visibles.
        </div>
      )}
    </section>
  )
}

function ConsolidatedPersonnelCard({ person }) {
  const visibleAssignments = person.assignments.slice(0, 3)
  const remainingAssignments = person.assignments.length - visibleAssignments.length

  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/74 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-5 text-[#000083]">{person.name}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#023BFD]/55">Ocupacion total</p>
        </div>
        <OccupationSignalChip occupation={person.totalOccupation} signal={person.totalSignal} className="min-w-[5.35rem]" />
      </div>

      <div className="mt-2 flex max-h-[5.2rem] flex-col gap-1 overflow-hidden">
        {visibleAssignments.map((assignment) => (
          <span
            key={assignment.id}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(1.25rem,0.24fr)_minmax(4.85rem,auto)] items-center gap-1"
          >
            <span className="inline-flex min-w-0 items-center rounded-full bg-[#dfeaff] px-2 py-0.5 text-[11px] font-medium text-[#000083]">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{assignment.role}</span>
                <span className="mx-1 text-[#023BFD]/28">•</span>
                <span>{assignment.projectName}</span>
              </span>
            </span>
            <span aria-hidden="true" className="assignment-leader h-px min-w-3 border-t border-dotted border-[#023BFD]/24" />
            <OccupationSignalChip occupation={assignment.occupation} signal={assignment.signal} />
          </span>
        ))}
        {remainingAssignments > 0 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            +{remainingAssignments} asignaciones mas
          </span>
        ) : null}
      </div>
    </div>
  )
}

function PortfolioPanel({
  projects,
  isInitialLoading,
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
          {isInitialLoading ? 'Cargando proyectos desde Netlify Blobs...' : 'No hay proyectos que coincidan con los filtros actuales.'}
        </div>
      ) : null}
    </div>
  )
}

function PortfolioProjectCard({ project, isSelected, onOpenDetail }) {
  const timeline = getTimelineProgress(project.startDate, project.endDate)
  const hoursConsumption = getHoursConsumptionProgress(project.budgetedHours, project.currentHours)
  const controlTone = healthToControlTone[project.health] || 'Estable'
  const personnelOverviewItems =
    project.teamAssigned?.filter((member) => member.name?.trim() || member.role?.trim()).map((member) => ({
      role: member.role?.trim() || 'Rol pendiente',
      name: member.name?.trim() || 'Sin nombre',
    })) || []
  const occupationItems =
    project.teamAssigned?.filter((member) => member.name?.trim() || member.role?.trim() || member.dedication?.trim()).map((member) => ({
      name: member.name?.trim() || 'Sin nombre',
      role: member.role?.trim() || 'Rol pendiente',
      occupation: formatOccupationValue(member.dedication) || 'Sin %',
      signal: getOccupationSignal(member.dedication),
    })) || []

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
            <CompactPersonnelFacts items={personnelOverviewItems} />
            <CompactDatesFact startDate={project.startDate} endDate={project.endDate} />
          </div>

          <div className="mt-2.5 space-y-2.5">
            <CompactStrip label="Riesgos principales" value={project.mainRisk || 'Sin riesgo registrado.'} variant="bullets" />
            <CompactStrip
              label="Objetivos actuales"
              value={project.currentObjective || project.description || 'Sin objetivos actuales definidos.'}
              variant="objectives"
            />
          </div>
        </div>

        <div className="min-w-0 border-b border-[#bfd9ff]/75 p-4 xl:border-b-0 xl:border-r">
          <div className="space-y-2.5">
            <OccupationCluster items={occupationItems} />
            <LabelCluster
              label="Tecnologias"
              items={project.technologiesUsed?.length ? project.technologiesUsed : ['Por definir']}
              subtle
            />
            <CompactContactCard contact={project.clientContact} />
            <CompactStrip
              label="Vigilancia critica"
              value={project.replacementWatch || 'Sin vigilancia critica registrada.'}
              variant="watch"
            />
          </div>
        </div>

        <div className="min-w-0 flex h-full flex-col gap-2.5 p-4">
          <div
            className={`flex min-h-[7.6rem] flex-1 flex-col rounded-[1.2rem] border px-3 py-2.5 ${
              controlToneCardClasses[controlTone] || controlToneCardClasses.Estable
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#023BFD]/68">Control</p>
              <span
                className={`rounded-full px-1.5 py-[0.12rem] text-[8px] font-semibold uppercase tracking-[0.08em] ${
                  controlToneChipClasses[controlTone] || controlToneChipClasses.Estable
                }`}
              >
                {controlTone}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-6 text-[12px] leading-4 text-slate-600">
              {project.controlSummary || 'Sin comentario ejecutivo registrado.'}
            </p>
          </div>

          <div className="rounded-[1.2rem] border border-[#bfd9ff] bg-white/78 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#023BFD]/68">Timeline</p>
                <p className="mt-0.5 text-[13px] font-medium leading-4 text-[#000083]">{timeline.label}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">{timeline.detail}</p>
              </div>
              <TimelineDonut startDate={project.startDate} endDate={project.endDate} size={62} strokeWidth={6} />
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-[#bfd9ff] bg-white/78 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#023BFD]/68">Horas</p>
                <p className="mt-0.5 text-[13px] font-medium leading-4 text-[#000083]">{hoursConsumption.label}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">{hoursConsumption.detail}</p>
              </div>
              <HoursConsumptionDonut budgetedHours={project.budgetedHours} currentHours={project.currentHours} size={62} strokeWidth={6} />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function CompactDatesFact({ startDate, endDate }) {
  const dateItems = [
    { label: 'Inicio', value: startDate ? formatDate(startDate) : 'Pendiente' },
    { label: 'Fin', value: endDate ? formatDate(endDate) : 'Pendiente' },
  ]

  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/74 px-3.5 py-2.5 md:col-span-2 xl:col-span-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Fechas</p>
      <div className="mt-1.5 flex max-h-[2.2rem] flex-col gap-0.5 overflow-hidden text-[11px] leading-4 text-slate-500">
        {dateItems.map((item) => (
          <p key={item.label} className="min-w-0 truncate">
            <span className="font-medium text-[#000083]">{item.label}</span>
            <span className="mx-1 text-[#023BFD]/28">•</span>
            <span>{item.value}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function CompactPersonnelFacts({ items }) {
  const visibleItems = items.slice(0, 4)
  const remainingCount = items.length - visibleItems.length

  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/74 px-3.5 py-2.5 md:col-span-2 xl:col-span-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Personal asignado</p>
      {visibleItems.length ? (
        <div className="mt-1.5 flex max-h-[2.2rem] flex-wrap items-center gap-x-2 gap-y-0.5 overflow-hidden text-[11px] leading-4 text-slate-500">
          {visibleItems.map((item) => (
            <span key={`${item.role}-${item.name}`} className="min-w-0 truncate">
              <span className="font-medium text-[#000083]">{item.role || 'Rol pendiente'}</span>
              <span className="mx-1 text-[#023BFD]/28">•</span>
              <span>{item.name || 'Sin nombre'}</span>
            </span>
          ))}
          {remainingCount > 0 ? (
            <span className="font-medium text-slate-500">+{remainingCount} perfiles mas</span>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Sin asignacion</p>
      )}
    </div>
  )
}

const compactBulletItems = (value, limit = 3) => {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    return []
  }

  return normalizedValue
    .split(/\n|•|;|\s+-\s+/)
    .map((item) => item.replace(/^[\s*-]+/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, limit)
}

function CompactStrip({ label, value, variant = 'text' }) {
  const isBulletVariant = variant === 'bullets' || variant === 'objectives' || variant === 'watch'
  const bulletItems = isBulletVariant ? compactBulletItems(value, variant === 'objectives' ? 2 : 3) : []
  const bulletListClass =
    variant === 'watch'
      ? 'mt-1 flex max-h-[4.55rem] flex-col gap-0.5 overflow-hidden text-[11px] leading-4 text-slate-600'
      : variant === 'objectives'
        ? 'mt-1 flex max-h-[2.35rem] flex-col gap-0.5 overflow-hidden text-[11px] leading-4 text-slate-600'
      : 'mt-1 flex max-h-[3rem] flex-col gap-0.5 overflow-hidden text-[11px] leading-4 text-slate-600'
  const bulletTextClass = variant === 'watch' ? 'line-clamp-2 min-w-0' : 'line-clamp-1 min-w-0'

  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/74 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">{label}</p>
      {isBulletVariant && bulletItems.length ? (
        <ul className={bulletListClass}>
          {bulletItems.map((item) => (
            <li key={item} className="flex min-w-0 items-start gap-1.5">
              <span className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-[#023BFD]/28" />
              <span className={bulletTextClass}>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-700">{value}</p>
      )}
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
            className={`tech-chip rounded-full px-2 py-0.5 text-[11px] font-medium ${
              subtle ? 'bg-[#edf4ff] text-[#294b91]' : 'bg-[#dfeaff] text-[#000083]'
            }`}
          >
            {item}
          </span>
        ))}
        {items.length > 8 ? (
          <span className="tech-chip rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">+{items.length - 8}</span>
        ) : null}
      </div>
    </div>
  )
}

function OccupationSignalChip({ occupation, signal, className = '' }) {
  const barWidth = `${Math.min(Math.max(signal.percentage, 4), 100)}%`

  return (
    <span
      className={`inline-flex min-w-0 items-center justify-between gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${signal.chipClass} ${className}`}
      title={`${occupation} · ${signal.label}`}
    >
      <span className="shrink-0 font-semibold tabular-nums">{occupation}</span>
      <span className={`h-1 min-w-4 flex-1 overflow-hidden rounded-full ${signal.trackClass}`}>
        <span className={`block h-full rounded-full ${signal.barClass}`} style={{ width: barWidth }} />
      </span>
    </span>
  )
}

function OccupationCluster({ items }) {
  const visibleItems = items.slice(0, 3)
  const remainingCount = items.length - visibleItems.length

  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/72 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Ocupacion %</p>
      {visibleItems.length ? (
        <div className="mt-1.5 flex max-h-[5.1rem] flex-col gap-1 overflow-hidden">
          {visibleItems.map((item) => {
            return (
              <span
                key={`${item.name}-${item.role}-${item.occupation}`}
                className="grid min-w-0 grid-cols-[minmax(0,4fr)_minmax(4.85rem,1fr)] items-center gap-1"
              >
                <span className="inline-flex min-w-0 items-center rounded-full bg-[#dfeaff] px-2 py-0.5 text-[11px] font-medium text-[#000083]">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{item.role}</span>
                    <span className="mx-1 text-[#023BFD]/28">•</span>
                    <span>{item.name}</span>
                  </span>
                </span>
                <OccupationSignalChip occupation={item.occupation} signal={item.signal} />
              </span>
            )
          })}
          {remainingCount > 0 ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">+{remainingCount}</span>
          ) : null}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Sin ocupacion registrada.</p>
      )}
    </div>
  )
}

function CompactContactCard({ contact }) {
  const hasContactInfo = contact?.name || contact?.title || contact?.email || contact?.chat

  return (
    <div className="rounded-[1.05rem] border border-[#bfd9ff] bg-white/72 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Main POC - Cliente</p>
      {hasContactInfo ? (
        <div className="mt-1.5 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-medium leading-4.5 text-[#000083]">{contact.name || 'Sin nombre'}</p>
            <p className="text-[11px] leading-4 text-slate-600">{contact.title || 'Cargo pendiente'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-4 text-slate-500">
            <p className="min-w-0 truncate">{contact.email || 'Email pendiente'}</p>
            <span className="text-[#023BFD]/28">•</span>
            <p className="min-w-0 truncate">{contact.chat || 'WhatsApp pendiente'}</p>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-sm text-slate-500">Sin contacto principal definido.</p>
      )}
    </div>
  )
}
function ProgressDonut({ progress, size = 78, strokeWidth = 8, caption = 'elapsed', compactText = false }) {
  const ringThemes = {
    unscheduled: {
      glow: 'shadow-[0_12px_28px_rgba(148,163,184,0.16)]',
      track: 'rgba(191,217,255,0.38)',
      progress: 'rgba(148,163,184,0.75)',
      text: 'text-slate-500',
      caption: 'text-slate-400',
    },
    early: {
      glow: 'shadow-[0_10px_24px_rgba(2,59,253,0.14)]',
      track: 'rgba(191,217,255,0.36)',
      progress: 'rgba(2,59,253,0.86)',
      text: 'text-[#023BFD]',
      caption: 'text-[#023BFD]/58',
    },
    mid: {
      glow: 'shadow-[0_10px_24px_rgba(16,84,255,0.16)]',
      track: 'rgba(191,217,255,0.36)',
      progress: 'rgba(16,84,255,0.92)',
      text: 'text-[#1054FF]',
      caption: 'text-[#1054FF]/60',
    },
    late: {
      glow: 'shadow-[0_10px_24px_rgba(245,158,11,0.14)]',
      track: 'rgba(255,224,130,0.28)',
      progress: 'rgba(245,158,11,0.95)',
      text: 'text-amber-600',
      caption: 'text-amber-600/60',
    },
    complete: {
      glow: 'shadow-[0_10px_24px_rgba(0,0,131,0.14)]',
      track: 'rgba(191,217,255,0.28)',
      progress: 'rgba(0,0,131,0.92)',
      text: 'text-[#000083]',
      caption: 'text-[#000083]/55',
    },
  }

  const theme = ringThemes[progress.tier] || ringThemes.early
  const radius = (size - strokeWidth) / 2
  const outerBoundaryRadius = size / 2 - 0.75
  const innerBoundaryRadius = Math.max(radius - strokeWidth / 2 + 0.75, 1)
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress.percentage / 100) * circumference

  return (
    <div
      className={`progress-donut relative shrink-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.98),rgba(238,245,255,0.82)_60%,rgba(223,234,255,0.4)_100%)] ${theme.glow}`}
      style={{ width: size, height: size }}
    >
      <svg className="relative z-10 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.progress}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerBoundaryRadius}
          fill="none"
          stroke="var(--donut-ring-outer)"
          strokeWidth="1"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerBoundaryRadius}
          fill="none"
          stroke="var(--donut-ring-inner)"
          strokeWidth="1"
        />
      </svg>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <span className={`font-display leading-none ${compactText ? 'text-[0.52rem]' : 'text-[0.95rem]'} ${theme.text}`}>
          {progress.percentage}%
        </span>
        {!compactText ? (
          <span className={`mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] ${theme.caption}`}>{caption}</span>
        ) : null}
      </div>
    </div>
  )
}

function TimelineDonut({ startDate, endDate, size = 78, strokeWidth = 8 }) {
  return (
    <ProgressDonut
      progress={getTimelineProgress(startDate, endDate)}
      size={size}
      strokeWidth={strokeWidth}
      caption="elapsed"
    />
  )
}

function HoursConsumptionDonut({ budgetedHours, currentHours, size = 78, strokeWidth = 8 }) {
  return (
    <ProgressDonut
      progress={getHoursConsumptionProgress(budgetedHours, currentHours)}
      size={size}
      strokeWidth={strokeWidth}
      caption="hours"
    />
  )
}

function PdfImportModal({
  state,
  onClose,
  onFileSelected,
  onFieldChange,
  onNestedFieldChange,
  onListItemChange,
  onAddListItem,
  onRemoveListItem,
  onAddTagItem,
  onRemoveTagItem,
  onConfirm,
}) {
  const [technologyTagDraft, setTechnologyTagDraft] = useState('')
  const draft = state.draft
  const confidenceByField = state.confidenceByField || {}
  const parserMeta = state.parserMeta || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 modal-overlay-enter">
      <button aria-label="Cerrar importador PDF" className="modal-backdrop absolute inset-0" type="button" onClick={onClose} />

      <div className="modal-shell modal-shell-enter relative z-10 w-full max-w-4xl">
        <div className="pointer-events-none absolute inset-x-10 top-0 z-0 h-24 rounded-full bg-[radial-gradient(circle,_rgba(2,59,253,0.18),_rgba(255,255,255,0)_72%)] blur-3xl" />

        <div className="relative z-20 mb-3 flex justify-end">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/72 text-xl leading-none text-[#000083] shadow-[0_14px_34px_rgba(2,59,253,0.16)] backdrop-blur-xl transition hover:bg-white"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-frame relative overflow-hidden rounded-[2.25rem]">
          <div className="dossier-scroll max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="glass-panel rounded-[2rem] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(243,248,255,0.72))] p-4 shadow-[0_30px_90px_rgba(2,59,253,0.18)] backdrop-blur-[26px] sm:p-5">
              <div className="mb-3 flex flex-col gap-3 border-b border-[#bfd9ff] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#023BFD]/70">Importador PDF</p>
                  <h2 className="font-display text-[1.45rem] leading-tight text-[#000083]">Crear proyecto desde documento Notion</h2>
                  <p className="mt-1 text-[13px] text-slate-700">
                    Sube un PDF por proyecto. La app extrae y prellena los campos para que solo confirmes o ajustes lo necesario.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#023BFD] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1054FF]">
                  Seleccionar PDF
                  <input
                    accept="application/pdf"
                    className="hidden"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        onFileSelected(file)
                        event.target.value = ''
                      }
                    }}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <SectionCard title="Estado de importacion">
                  <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <div className="rounded-[1rem] border border-[#bfd9ff] bg-white/70 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Archivo</p>
                      <p className="mt-1.5 text-sm font-medium text-[#000083]">{state.fileName || 'Aun no has seleccionado un PDF.'}</p>
                    </div>
                    <div className="rounded-[1rem] border border-[#bfd9ff] bg-white/70 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Extraccion</p>
                      <p className="mt-1.5 text-sm font-medium text-[#000083]">
                        {state.isParsing ? 'Analizando PDF...' : draft ? 'Borrador listo' : 'Pendiente'}
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-[#bfd9ff] bg-white/70 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Campos faltantes</p>
                      <p className="mt-1.5 text-sm font-medium text-[#000083]">{state.missingFields.length}</p>
                    </div>
                  </div>

                  {state.error ? (
                    <p className="rounded-[0.95rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
                  ) : null}

                  {parserMeta.detectedSections?.length ? (
                    <div className="rounded-[1rem] border border-[#bfd9ff] bg-white/70 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Secciones detectadas</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {parserMeta.detectedSections.map((section) => (
                          <span key={section} className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[11px] font-medium text-[#294b91]">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {state.missingFields.length ? (
                    <div className="rounded-[1rem] border border-dashed border-[#bfd9ff] bg-white/55 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#023BFD]/70">Campos a revisar manualmente</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {state.missingFields.map((field) => (
                          <span key={field} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {formatImportFieldName(field)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </SectionCard>

                {draft ? (
                  <>
                    <SectionCard title="Vista previa importada">
                      <div className="grid gap-2.5 xl:grid-cols-4">
                        <InputField
                          label={renderConfidenceLabel('Nombre del proyecto', confidenceByField.name)}
                          value={draft.name}
                          onChange={(value) => onFieldChange('name', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Cliente', confidenceByField.client)}
                          value={draft.client}
                          onChange={(value) => onFieldChange('client', value)}
                        />
                        <SelectField
                          label={renderConfidenceLabel('Tipo de proyecto', confidenceByField.initiativeType)}
                          value={draft.initiativeType}
                          options={initiativeOptions}
                          onChange={(value) => onFieldChange('initiativeType', value)}
                        />
                        <SelectField
                          label={renderConfidenceLabel('Estado general / salud', confidenceByField.health)}
                          value={draft.health}
                          options={healthOptions}
                          onChange={(value) => onFieldChange('health', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Fecha inicio', confidenceByField.startDate)}
                          type="date"
                          value={draft.startDate}
                          onChange={(value) => onFieldChange('startDate', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Fecha fin', confidenceByField.endDate)}
                          type="date"
                          value={draft.endDate}
                          onChange={(value) => onFieldChange('endDate', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Horas presupuestadas', confidenceByField.budgetedHours)}
                          type="number"
                          value={draft.budgetedHours}
                          onChange={(value) => onFieldChange('budgetedHours', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Consumo actual', confidenceByField.currentHours)}
                          type="number"
                          value={draft.currentHours}
                          onChange={(value) => onFieldChange('currentHours', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Proximo hito', confidenceByField.nextMilestone)}
                          value={draft.nextMilestone}
                          inputClassName="xl:col-span-3"
                          onChange={(value) => onFieldChange('nextMilestone', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Fecha del hito', confidenceByField.nextMilestoneDate)}
                          type="date"
                          value={draft.nextMilestoneDate}
                          onChange={(value) => onFieldChange('nextMilestoneDate', value)}
                        />
                      </div>

                      <div className="grid gap-2.5 xl:grid-cols-2">
                        <TextAreaField
                          label={renderConfidenceLabel('Descripcion', confidenceByField.description)}
                          value={draft.description}
                          rows={2}
                          onChange={(value) => onFieldChange('description', value)}
                        />
                        <TextAreaField
                          label={renderConfidenceLabel('Resumen ejecutivo de control', confidenceByField.controlSummary)}
                          value={draft.controlSummary}
                          rows={2}
                          onChange={(value) => onFieldChange('controlSummary', value)}
                        />
                      </div>

                      <TagField
                        label={renderConfidenceLabel('Tecnologias utilizadas', confidenceByField.technologiesUsed)}
                        value={technologyTagDraft}
                        tags={draft.technologiesUsed}
                        placeholder="Agregar tecnologia"
                        onChange={setTechnologyTagDraft}
                        onAdd={() => {
                          onAddTagItem('technologiesUsed', technologyTagDraft)
                          setTechnologyTagDraft('')
                        }}
                        onRemove={(tag) => onRemoveTagItem('technologiesUsed', tag)}
                      />
                    </SectionCard>

                    <SectionCard title={renderConfidenceSectionTitle('Personal asignado', confidenceByField.teamAssigned)}>
                      <div className="space-y-2">
                        {draft.teamAssigned.length ? (
                          draft.teamAssigned.map((member) => (
                            <TeamAssignedRow
                              key={member.id}
                              name={member.name}
                              role={member.role}
                              occupation={member.dedication}
                              onNameChange={(value) => onListItemChange('teamAssigned', member.id, 'name', value)}
                              onRoleChange={(value) => onListItemChange('teamAssigned', member.id, 'role', value)}
                              onOccupationChange={(value) => onListItemChange('teamAssigned', member.id, 'dedication', value)}
                              onRemove={() => onRemoveListItem('teamAssigned', member.id)}
                            />
                          ))
                        ) : (
                          <p className="rounded-[0.95rem] border border-dashed border-[#bfd9ff] bg-white/55 px-3 py-3 text-sm text-slate-500">
                            No se detecto personal asignado con suficiente estructura.
                          </p>
                        )}
                      </div>
                      <div className="pt-1">
                        <button
                          className="action-button w-full sm:w-auto"
                          type="button"
                          onClick={() => onAddListItem('teamAssigned', { role: '', name: '', dedication: '' })}
                        >
                          Agregar rol
                        </button>
                      </div>
                    </SectionCard>

                    <SectionCard title="Riesgos y contexto">
                      <div className="grid gap-2.5 xl:grid-cols-2">
                        <TextAreaField
                          label={renderConfidenceLabel('Riesgos principales', confidenceByField.mainRisk)}
                          value={draft.mainRisk}
                          rows={3}
                          onChange={(value) => onFieldChange('mainRisk', value)}
                        />
                        <TextAreaField
                          label={renderConfidenceLabel('Alertas activas', confidenceByField.alertsAndRisks)}
                          value={draft.alertsAndRisks}
                          rows={3}
                          onChange={(value) => onFieldChange('alertsAndRisks', value)}
                        />
                        <TextAreaField
                          label={renderConfidenceLabel('Objetivos actuales', confidenceByField.currentObjective)}
                          value={draft.currentObjective}
                          rows={3}
                          onChange={(value) => onFieldChange('currentObjective', value)}
                        />
                        <TextAreaField
                          label={renderConfidenceLabel('Vigilancia critica', confidenceByField.replacementWatch)}
                          value={draft.replacementWatch}
                          rows={3}
                          onChange={(value) => onFieldChange('replacementWatch', value)}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard title="Main POC - Cliente">
                      <div className="grid gap-2.5 md:grid-cols-2">
                        <InputField
                          label={renderConfidenceLabel('Nombre', confidenceByField['clientContact.name'])}
                          value={draft.clientContact.name}
                          onChange={(value) => onNestedFieldChange('clientContact', 'name', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Cargo', confidenceByField['clientContact.title'])}
                          value={draft.clientContact.title}
                          onChange={(value) => onNestedFieldChange('clientContact', 'title', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('Email', confidenceByField['clientContact.email'])}
                          type="email"
                          value={draft.clientContact.email}
                          onChange={(value) => onNestedFieldChange('clientContact', 'email', value)}
                        />
                        <InputField
                          label={renderConfidenceLabel('WhatsApp', confidenceByField['clientContact.chat'])}
                          value={draft.clientContact.chat}
                          onChange={(value) => onNestedFieldChange('clientContact', 'chat', value)}
                        />
                      </div>
                    </SectionCard>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-[#000083] ring-1 ring-inset ring-[#bfd9ff] transition hover:bg-white"
                        type="button"
                        onClick={onClose}
                      >
                        Cancelar
                      </button>
                      <button className="rounded-full bg-[#023BFD] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1054FF]" type="button" onClick={onConfirm}>
                        Confirmar e importar proyecto
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderConfidenceLabel(label, confidence) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{label}</span>
      {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
    </span>
  )
}

function renderConfidenceSectionTitle(label, confidence) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{label}</span>
      {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
    </span>
  )
}

function formatImportFieldName(field) {
  const labels = {
    description: 'Descripcion',
    controlSummary: 'Resumen ejecutivo de control',
    mainRisk: 'Riesgos principales',
    currentObjective: 'Objetivos actuales',
    technologiesUsed: 'Tecnologias',
    clientContact: 'Main POC - Cliente',
    replacementWatch: 'Vigilancia critica',
    alertsAndRisks: 'Alertas activas',
    openDecisions: 'Temas por decidir',
    importantMeetings: 'Reuniones importantes',
    internalComments: 'Comentarios internos',
  }

  return labels[field] || field
}

function ConfidenceBadge({ confidence }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${confidenceToneClasses[confidence] || confidenceToneClasses.Baja}`}>
      {confidence}
    </span>
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

        <div className="relative z-20 mb-3 flex justify-end">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/72 text-xl leading-none text-[#000083] shadow-[0_14px_34px_rgba(2,59,253,0.16)] backdrop-blur-xl transition hover:bg-white"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-frame relative overflow-hidden rounded-[2.25rem]">
          <div className="dossier-scroll max-h-[calc(100vh-6rem)] overflow-y-auto">
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
  const [technologyTagDraft, setTechnologyTagDraft] = useState('')

  return (
    <div
      className={`glass-panel rounded-[2rem] p-5 sm:p-6 ${
        modal
          ? 'border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(243,248,255,0.72))] p-3.5 shadow-[0_30px_90px_rgba(2,59,253,0.18)] backdrop-blur-[26px] sm:p-4'
          : 'h-full'
      }`}
    >
      <div className="mb-3 flex flex-col gap-2.5 border-b border-[#bfd9ff] pb-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <HealthBadge health={project.health} />
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#023BFD]/70">Dossier del proyecto</span>
          </div>
          <h2 className="font-display text-[1.45rem] leading-tight text-[#000083]">{project.name}</h2>
          <p className="mt-0.5 max-w-2xl text-[13px] text-slate-700">
            Ultima actualizacion registrada: {formatDate(project.lastUpdated, { timeStyle: 'short' })}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="rounded-[0.95rem] border border-[#bfd9ff] bg-white/65 px-3 py-1.5 text-sm text-slate-700">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#023BFD]/70">Cliente</p>
            <p className="mt-0.5 text-[15px] font-medium text-[#000083]">{project.client || 'Pendiente de definir'}</p>
          </div>
          <div className="rounded-[0.95rem] border border-[#bfd9ff] bg-white/65 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#023BFD]/70">Timeline</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Inicio vs cierre</p>
              </div>
              <TimelineDonut startDate={project.startDate} endDate={project.endDate} size={58} strokeWidth={6} />
            </div>
          </div>
          <div className="rounded-[0.95rem] border border-[#bfd9ff] bg-white/65 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#023BFD]/70">Horas</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Budget vs consumo</p>
              </div>
              <HoursConsumptionDonut budgetedHours={project.budgetedHours} currentHours={project.currentHours} size={58} strokeWidth={6} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionCard title="Vista general">
          <div className="grid gap-2.5 xl:grid-cols-4">
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
              label="Horas presupuestadas"
              type="number"
              value={project.budgetedHours}
              onChange={(value) => onFieldChange(project.id, 'budgetedHours', value)}
            />
            <InputField
              label="Consumo actual"
              type="number"
              value={project.currentHours}
              onChange={(value) => onFieldChange(project.id, 'currentHours', value)}
            />
            <InputField
              label="Proximo hito"
              value={project.nextMilestone}
              inputClassName="xl:col-span-3"
              onChange={(value) => onFieldChange(project.id, 'nextMilestone', value)}
            />
            <InputField
              label="Fecha del hito"
              type="date"
              value={project.nextMilestoneDate}
              inputClassName="xl:col-span-1"
              onChange={(value) => onFieldChange(project.id, 'nextMilestoneDate', value)}
            />
          </div>

          <div className="grid gap-2.5 xl:grid-cols-2">
            <TextAreaField
              label="Descripcion"
              value={project.description}
              onChange={(value) => onFieldChange(project.id, 'description', value)}
              rows={2}
            />
            <TextAreaField
              label="Resumen ejecutivo de control"
              value={project.controlSummary}
              onChange={(value) => onFieldChange(project.id, 'controlSummary', value)}
              rows={2}
            />
          </div>

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

          <div className="grid gap-2.5 xl:grid-cols-2">
            <TextAreaField
              label="Riesgos principales"
              value={project.mainRisk}
              onChange={(value) => onFieldChange(project.id, 'mainRisk', value)}
              rows={2}
            />
            <TextAreaField
              label="Objetivos actuales"
              value={project.currentObjective}
              onChange={(value) => onFieldChange(project.id, 'currentObjective', value)}
              rows={2}
            />
          </div>
        </SectionCard>

        <SectionCard title="Main POC - Cliente y vigilancia critica">
          <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid gap-2.5 md:grid-cols-2">
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
            <TextAreaField
              label="Vigilancia critica"
              value={project.replacementWatch}
              onChange={(value) => onFieldChange(project.id, 'replacementWatch', value)}
              rows={3}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Personal asignado"
          actionLabel="Agregar rol"
          onAction={() => onAddListItem(project.id, 'teamAssigned', { role: '', name: '', dedication: '' })}
        >
          <div className="space-y-2">
            {project.teamAssigned.map((member) => (
              <TeamAssignedRow
                key={member.id}
                name={member.name}
                role={member.role}
                occupation={member.dedication}
                onNameChange={(value) => onListItemChange(project.id, 'teamAssigned', member.id, 'name', value)}
                onRoleChange={(value) => onListItemChange(project.id, 'teamAssigned', member.id, 'role', value)}
                onOccupationChange={(value) => onListItemChange(project.id, 'teamAssigned', member.id, 'dedication', value)}
                onRemove={() => onRemoveListItem(project.id, 'teamAssigned', member.id)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Alertas y decisiones">
          <div className="grid gap-2.5 xl:grid-cols-2">
            <TextAreaField
              label="Alertas activas"
              value={project.alertsAndRisks}
              onChange={(value) => onFieldChange(project.id, 'alertsAndRisks', value)}
              rows={3}
            />
            <TextAreaField
              label="Temas por decidir"
              value={project.openDecisions}
              onChange={(value) => onFieldChange(project.id, 'openDecisions', value)}
              rows={3}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Reuniones frecuentes / importantes"
          actionLabel="Agregar reunion"
          actionIcon="plus"
          onAction={() => onAddListItem(project.id, 'importantMeetings', { title: '', date: '', participants: '', objective: '' })}
        >
          <div className="space-y-2">
            {project.importantMeetings.map((meeting) => (
              <EditableRow
                key={meeting.id}
                compact
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

        <SectionCard title="Notas internas y bitacora">
          <div className="grid gap-2.5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <TextAreaField
              label="Comentarios internos"
              value={project.internalComments}
              onChange={(value) => onFieldChange(project.id, 'internalComments', value)}
              rows={3}
            />
            <CommentComposer value={pendingComment} onChange={setPendingComment} onSubmit={onAddComment} />
          </div>

          <div className="space-y-2">
            {project.commentLog.map((comment) => (
              <article
                key={comment.id}
                className={`rounded-[0.95rem] border px-3 py-2.5 text-sm ${
                  comment.resolved
                    ? 'border-emerald-300/50 bg-emerald-50 text-slate-700'
                    : 'border-[#bfd9ff] bg-white/80 text-slate-800'
                }`}
              >
                <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#023BFD]/60">
                    {formatDate(comment.createdAt, { timeStyle: 'short' })}
                  </p>
                  <button
                    className="rounded-full border border-[#bfd9ff] px-2.5 py-1 text-[10px] text-[#000083] transition hover:bg-[#bfd9ff]/35"
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
              <p className="rounded-[0.95rem] border border-dashed border-[#bfd9ff] bg-white/55 px-3 py-3 text-sm text-slate-500">
                Aun no hay comentarios registrados para este proyecto.
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function SectionCard({ title, children, actionLabel, onAction, actionIcon = null }) {
  return (
    <section className="rounded-[1.1rem] border border-[#bfd9ff] bg-white/62 p-3.5 shadow-[0_8px_24px_rgba(16,84,255,0.06)]">
      <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-[15px] font-semibold text-[#000083]">{title}</h3>
        {actionLabel ? (
          <button
            aria-label={actionLabel}
            className={
              actionIcon === 'plus'
                ? 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#bfd9ff] bg-white/85 text-[#023BFD] transition hover:bg-[#edf4ff]'
                : 'action-button w-full sm:w-auto'
            }
            type="button"
            onClick={onAction}
          >
            {actionIcon === 'plus' ? <span className="text-[18px] leading-none">+</span> : actionLabel}
          </button>
        ) : null}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function EditableRow({ fields, onRemove, columns = 3, compact = false }) {
  const gridClass = columns === 4 ? 'xl:grid-cols-4' : 'md:grid-cols-3'

  return (
    <div className={`relative rounded-[1rem] border border-[#bfd9ff] bg-[#f8fbff] ${compact ? 'p-2.5 pr-11' : 'p-3 pr-12'}`}>
      <button
        aria-label="Eliminar fila"
        className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200/70 bg-white/85 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
        type="button"
        onClick={onRemove}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 7l1 12a2 2 0 0 0 2 1h6a2 2 0 0 0 2-1l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
          />
        </svg>
      </button>
      <div className={`grid ${compact ? 'gap-2.5' : 'gap-3'} ${gridClass}`}>
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
    </div>
  )
}

function TeamAssignedRow({ name, role, occupation, onNameChange, onRoleChange, onOccupationChange, onRemove }) {
  return (
    <div className="relative rounded-[1rem] border border-[#bfd9ff] bg-[#f8fbff] p-2.5 pr-11">
      <button
        aria-label="Eliminar rol"
        className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200/70 bg-white/85 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
        type="button"
        onClick={onRemove}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 7l1 12a2 2 0 0 0 2 1h6a2 2 0 0 0 2-1l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
          />
        </svg>
      </button>

      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_180px]">
        <InputField label="Nombre" value={name} onChange={onNameChange} />
        <InputField label="Rol" value={role} onChange={onRoleChange} />
        <OccupationField value={occupation} onChange={onOccupationChange} />
      </div>
    </div>
  )
}

function OccupationField({ value, onChange }) {
  const progress = getOccupationProgress(value)

  return (
    <label className="field-shell">
      <span className="field-label">Ocupacion estimada</span>
      <div className="flex items-center gap-1.5 rounded-[0.82rem] border border-[#bfd9ff] bg-white/86 px-2 py-1">
        <input
          className="min-w-0 flex-1 bg-transparent text-[0.94rem] font-medium leading-[1.3] text-[#0f172a] outline-none"
          value={value}
          placeholder="80%"
          onChange={(event) => onChange(event.target.value)}
        />
        <ProgressDonut progress={progress} size={32} strokeWidth={4} compactText />
      </div>
    </label>
  )
}

function TagField({ label, tags, value, onChange, onAdd, onRemove, placeholder }) {
  return (
    <div className="field-shell">
      <span className="field-label">{label}</span>
      <div className="rounded-[1rem] border border-[#bfd9ff] bg-white/68 p-2.5">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
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

        <div className="flex flex-col gap-1.5 sm:flex-row">
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

function InputField({ label, value, onChange, type = 'text', placeholder, inputClassName = '' }) {
  return (
    <label className={`field-shell ${inputClassName}`.trim()}>
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
        className="field-input min-h-[5.1rem] resize-y"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function CommentComposer({ value, onChange, onSubmit }) {
  return (
    <label className="field-shell">
      <span className="field-label">Nuevo comentario</span>
      <div className="relative">
        <textarea
          className="field-input min-h-[5.1rem] resize-y pr-14"
          rows={3}
          value={value}
          placeholder="Escribe una observacion, decision o alerta operativa..."
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-label="Agregar comentario"
          className="absolute bottom-2.5 right-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#bfd9ff] bg-white/85 text-[#023BFD] transition hover:bg-[#edf4ff]"
          type="button"
          onClick={onSubmit}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 11l6-6 6 6" />
          </svg>
        </button>
      </div>
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
      <span className={`health-dot h-2.5 w-2.5 rounded-full ${healthDotClasses[health]}`}></span>
      {health}
    </span>
  )
}

export default App
