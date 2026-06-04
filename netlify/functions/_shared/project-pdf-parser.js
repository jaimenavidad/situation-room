const initiativeTypeMap = new Map([
  ['on demand', 'on demand'],
  ['ai', 'ai'],
  ['artificial intelligence', 'ai'],
  ['data', 'data'],
  ['cloud', 'cloud computing'],
  ['cloud computing', 'cloud computing'],
  ['smart endpoints', 'cloud computing'],
  ['staff augmentation', 'staff augmentation'],
  ['team augmentation', 'team augmentation'],
])

const headings = [
  'Comments',
  'Forecast',
  'Summary Effort',
  'Cumulative General Effort',
  'Risks',
  'Roadmap Milestones',
  'Payment Milestones',
  'Assigned Boosters',
  'Resources',
]

const knownFieldLabels = [
  'Client',
  'Description',
  'Leaders',
  'Project Type',
  'Status',
  'Start Date',
  'End Date',
  'Timeline Progress',
  'Effort Usage',
  'Effort Estimated',
  'Effort Real',
  'Effort Last Update',
  'Effort Last Upda',
  'Risks Health',
  'Roadmap Health',
  'Tags',
  'Project Code',
  'Project Code Na',
  'Project id (VAR)',
  'Last edited by',
  'Last edited time',
  'Archived',
]

const roleHints = [
  'Integration Engineer',
  'Full-stack Engineer',
  'Project Manager',
  'Webflow Dev',
  'QA Analyst',
  'Tech Lead',
  'Designer',
  'Copywriter',
  'Developer',
  'Backend',
  'Frontend',
  'DevOps',
  'UXUI',
  'CRS',
  'QA',
  'PM',
]

const stripEmpty = (value) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  return normalized && normalized.toLowerCase() !== 'empty' ? normalized : ''
}

const normalizeDate = (value) => {
  const cleaned = stripEmpty(value)

  if (!cleaned) {
    return ''
  }

  const match = cleaned.match(/(\d{4})[/-](\d{2})[/-](\d{2})/)

  if (!match) {
    return ''
  }

  return `${match[1]}-${match[2]}-${match[3]}`
}

const normalizeInitiativeType = (value) => {
  const cleaned = stripEmpty(value).toLowerCase()

  if (!cleaned) {
    return ''
  }

  for (const [key, mapped] of initiativeTypeMap.entries()) {
    if (cleaned.includes(key)) {
      return mapped
    }
  }

  return ''
}

const normalizeHealth = (...candidates) => {
  for (const candidate of candidates) {
    const cleaned = stripEmpty(candidate).toLowerCase()

    if (!cleaned) {
      continue
    }

    if (cleaned.includes('on track') || cleaned.includes('green') || cleaned.includes('stable')) {
      return 'Verde'
    }

    if (
      cleaned.includes('at risk') ||
      cleaned.includes('warning') ||
      cleaned.includes('yellow') ||
      cleaned.includes('in process') ||
      cleaned.includes('in progress')
    ) {
      return 'Amarillo'
    }

    if (
      cleaned.includes('critical') ||
      cleaned.includes('blocked') ||
      cleaned.includes('off track') ||
      cleaned.includes('red')
    ) {
      return 'Rojo'
    }
  }

  return ''
}

const normalizePdfText = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(
      (line) =>
        line &&
        !line.includes('| Notion https://') &&
        !/^\d+\s+of\s+\d+/.test(line) &&
        !/^\d{1,2}\/\d{1,2}\/\d{2,4},/.test(line),
    )

const isKnownLabelOrHeading = (value) => {
  const normalized = stripEmpty(value).toLowerCase()

  if (!normalized) {
    return false
  }

  return [...knownFieldLabels, ...headings].some((label) => {
    const normalizedLabel = label.toLowerCase()
    return normalized === normalizedLabel || normalized.startsWith(normalizedLabel)
  })
}

const getFieldValue = (lines, label) => {
  const normalizedLabel = label.toLowerCase()
  const lineIndex = lines.findIndex((line) => line.toLowerCase().startsWith(normalizedLabel))

  if (lineIndex === -1) {
    return ''
  }

  const line = lines[lineIndex]
  const inlineValue = stripEmpty(line.slice(label.length))

  if (inlineValue) {
    return inlineValue
  }

  const nextLine = lines[lineIndex + 1]

  if (!nextLine || isKnownLabelOrHeading(nextLine)) {
    return ''
  }

  return stripEmpty(nextLine)
}

const getSectionLines = (lines, heading) => {
  const startIndex = lines.findIndex((line) => line.toLowerCase() === heading.toLowerCase())

  if (startIndex === -1) {
    return []
  }

  const collected = []

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (headings.includes(line) && line.toLowerCase() !== heading.toLowerCase()) {
      break
    }

    collected.push(line)
  }

  return collected
}

const parseAssignedBoosters = (lines) =>
  lines
    .filter(
      (line) =>
        line &&
        !/^ID\s*Booster\s*Role\s*Occupation\s*Billable$/i.test(line) &&
        !/^New page$/i.test(line),
    )
    .map((line) => line.replace(/^\[\]\s*/, '').trim())
    .map((line) => {
      const compactMatch = line.match(/^(.*?)(\d{1,3})%(?:\s*(yes|no))?$/i)

      if (compactMatch) {
        const dedication = compactMatch[2]
        const assignment = compactMatch[1].trim()
        const role = roleHints.find((hint) => assignment.toLowerCase().endsWith(hint.toLowerCase())) || ''
        const name = role ? assignment.slice(0, -role.length).trim() : assignment

        if (name || role) {
          return {
            name,
            role,
            dedication,
          }
        }
      }

      const tokens = line.split(/\s+/).filter(Boolean)

      if (!tokens.length) {
        return null
      }

      if (/^(yes|no)$/i.test(tokens.at(-1))) {
        tokens.pop()
      }

      const dedication = /^\d+%$/.test(tokens.at(-1) || '') ? tokens.pop() : ''
      const role = tokens.pop() || ''
      const name = tokens.join(' ').trim()

      if (!name && !role) {
        return null
      }

      return {
        name,
        role,
        dedication: dedication.replace('%', ''),
      }
    })
    .filter(Boolean)

const parseMilestone = (lines) => {
  const candidate = lines.find(
    (line) =>
      line &&
      !/^Title Health Start Date$/i.test(line) &&
      !/^[\d.\s-]+$/.test(line),
  )

  if (!candidate) {
    return { nextMilestone: '', nextMilestoneDate: '' }
  }

  const dateMatch = candidate.match(/(\d{4}[/-]\d{2}[/-]\d{2})/)
  const nextMilestoneDate = dateMatch ? normalizeDate(dateMatch[1]) : ''
  const nextMilestone = stripEmpty(
    candidate
      .replace(/(\d{4}[/-]\d{2}[/-]\d{2})/, '')
      .replace(/\b\d+\.\s*(On Track|At Risk|Critical|Blocked|In Process)\b/gi, '')
      .replace(/\s+/g, ' '),
  )

  return {
    nextMilestone,
    nextMilestoneDate,
  }
}

const parseRisks = (lines) => {
  const rows = lines.filter(
    (line) =>
      line &&
      !/^Title Health Level Probability$/i.test(line) &&
      !/^[\d.\s-]+$/.test(line),
  )

  if (!rows.length) {
    return { mainRisk: '', alertsAndRisks: '' }
  }

  return {
    mainRisk: rows[0],
    alertsAndRisks: rows.join('\n'),
  }
}

const parseTechnologies = (value) =>
  stripEmpty(value)
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean)

const buildConfidenceMap = (draft) => {
  const confidence = {}

  const setConfidence = (field, value, level) => {
    if (value) {
      confidence[field] = level
    }
  }

  setConfidence('name', draft.name, 'Alta')
  setConfidence('client', draft.client, 'Alta')
  setConfidence('initiativeType', draft.initiativeType, 'Alta')
  setConfidence('health', draft.health, 'Media')
  setConfidence('description', draft.description, 'Alta')
  setConfidence('startDate', draft.startDate, 'Alta')
  setConfidence('endDate', draft.endDate, 'Alta')
  setConfidence('budgetedHours', draft.budgetedHours, 'Alta')
  setConfidence('currentHours', draft.currentHours, 'Alta')
  setConfidence('nextMilestone', draft.nextMilestone, 'Media')
  setConfidence('nextMilestoneDate', draft.nextMilestoneDate, 'Media')
  setConfidence('technologiesUsed', draft.technologiesUsed?.length, 'Baja')
  setConfidence('mainRisk', draft.mainRisk, 'Media')
  setConfidence('alertsAndRisks', draft.alertsAndRisks, 'Media')
  setConfidence('teamAssigned', draft.teamAssigned?.length, 'Alta')

  return confidence
}

const buildMissingFields = (draft) => {
  const missing = []

  const pushIfMissing = (field, value) => {
    const emptyArray = Array.isArray(value) && value.length === 0
    const emptyObject =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).every((item) => !stripEmpty(item))

    if (!value || emptyArray || emptyObject) {
      missing.push(field)
    }
  }

  pushIfMissing('description', draft.description)
  pushIfMissing('controlSummary', draft.controlSummary)
  pushIfMissing('mainRisk', draft.mainRisk)
  pushIfMissing('currentObjective', draft.currentObjective)
  pushIfMissing('technologiesUsed', draft.technologiesUsed)
  pushIfMissing('clientContact', draft.clientContact)
  pushIfMissing('replacementWatch', draft.replacementWatch)
  pushIfMissing('alertsAndRisks', draft.alertsAndRisks)
  pushIfMissing('openDecisions', draft.openDecisions)
  pushIfMissing('importantMeetings', draft.importantMeetings)
  pushIfMissing('internalComments', draft.internalComments)

  return missing
}

export const parseProjectPdfText = (text) => {
  const lines = normalizePdfText(text)
  const title = stripEmpty(lines[0])
  const client = getFieldValue(lines, 'Client')
  const description = getFieldValue(lines, 'Description')
  const projectType = getFieldValue(lines, 'Project Type')
  const status = getFieldValue(lines, 'Status')
  const startDate = normalizeDate(getFieldValue(lines, 'Start Date'))
  const endDate = normalizeDate(getFieldValue(lines, 'End Date'))
  const effortEstimated = getFieldValue(lines, 'Effort Estimated')
  const effortReal = getFieldValue(lines, 'Effort Real')
  const risksHealth = getFieldValue(lines, 'Risks Health')
  const roadmapHealth = getFieldValue(lines, 'Roadmap Health')
  const tags = getFieldValue(lines, 'Tags')

  const assignedBoosters = parseAssignedBoosters(getSectionLines(lines, 'Assigned Boosters'))
  const milestone = parseMilestone(getSectionLines(lines, 'Roadmap Milestones'))
  const risks = parseRisks(getSectionLines(lines, 'Risks'))

  const draft = {
    name: title,
    client,
    initiativeType: normalizeInitiativeType(projectType) || 'on demand',
    health: normalizeHealth(risksHealth, roadmapHealth, status) || 'Verde',
    description,
    startDate,
    endDate,
    budgetedHours: effortEstimated,
    currentHours: effortReal,
    nextMilestone: milestone.nextMilestone,
    nextMilestoneDate: milestone.nextMilestoneDate,
    controlSummary: '',
    mainRisk: risks.mainRisk,
    currentObjective: '',
    technologiesUsed: parseTechnologies(tags),
    clientContact: {
      name: '',
      title: '',
      email: '',
      chat: '',
    },
    replacementWatch: '',
    alertsAndRisks: risks.alertsAndRisks,
    openDecisions: '',
    internalComments: '',
    teamAssigned: assignedBoosters,
    importantMeetings: [],
  }

  return {
    projectDraft: draft,
    confidenceByField: buildConfidenceMap(draft),
    missingFields: buildMissingFields(draft),
    parserMeta: {
      detectedSections: headings.filter((heading) => lines.includes(heading)),
      leaders: getFieldValue(lines, 'Leaders'),
      status,
      risksHealth,
      roadmapHealth,
      rawFieldsDetected: knownFieldLabels.filter((label) => lines.some((line) => line.startsWith(label))),
    },
  }
}
