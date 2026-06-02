const now = '2026-06-01T13:30:00.000Z'

export const sampleProjects = [
  {
    id: 'ai-client-assistant',
    name: 'AI Client Assistant',
    client: 'Northstar Health',
    initiativeType: 'AI',
    health: 'Amarillo',
    nextMilestone: 'Pilot con respuestas sugeridas en Zendesk',
    nextMilestoneDate: '2026-06-06',
    pmResponsible: 'Daniela Rivas',
    pmBackup: 'Marcela Cruz',
    mainRisk: 'Falta aprobacion final del equipo legal para entrenamiento con historicos anonimizados.',
    assignedPeople: 'PM, AI Lead, UX Writer, 2 Full-stack',
    lastUpdated: now,
    quickComments: 'Cliente receptivo, pero sensible a tiempos de compliance.',
    clientContact: {
      name: 'Megan Holt',
      title: 'Director of Digital Care',
      email: 'mholt@northstarhealth.example',
      chat: 'Slack Connect / WhatsApp',
    },
    currentObjective:
      'Cerrar el piloto funcional de respuestas asistidas para tickets de soporte de primer nivel y demostrar reduccion de tiempo promedio de respuesta.',
    teamAssigned: [
      { id: 'team-1', role: 'AI Lead', name: 'Sofia Mena', dedication: '60%' },
      { id: 'team-2', role: 'Full-stack Engineer', name: 'Diego Campos', dedication: '100%' },
      { id: 'team-3', role: 'UX Writer', name: 'Lucia Flores', dedication: '40%' },
    ],
    milestones: [
      { id: 'mile-1', title: 'Validacion de prompts y guardrails', date: '2026-06-03', owner: 'Sofia Mena', status: 'En revision' },
      { id: 'mile-2', title: 'Pilot release en sandbox del cliente', date: '2026-06-06', owner: 'Diego Campos', status: 'En progreso' },
    ],
    clientPending: [
      { id: 'cp-1', item: 'Aprobacion de documento de uso de datos', dueDate: '2026-06-02', impact: 'Bloquea despliegue del piloto' },
      { id: 'cp-2', item: 'Confirmar lista de agentes participantes', dueDate: '2026-06-04', impact: 'Afecta plan de entrenamiento' },
    ],
    internalPending: [
      { id: 'ip-1', item: 'Completar suite de evaluacion de intents', dueDate: '2026-06-02', owner: 'Sofia Mena' },
      { id: 'ip-2', item: 'Afinar dashboard de trazabilidad', dueDate: '2026-06-05', owner: 'Diego Campos' },
    ],
    alertsAndRisks:
      'El sponsor de seguridad pidio un checkpoint adicional antes de cualquier ambiente conectado al CRM. Si no se atiende esta semana, el piloto se mueve una semana completa.',
    openDecisions:
      'Definir si el copiloto va en Zendesk sidebar o en una interfaz aparte para supervisores. Tambien queda abierta la politica de tono de respuesta por segmento.',
    latestCommunication: {
      date: '2026-05-30',
      summary:
        'Se acordo priorizar 12 intents de alto volumen y demostrar control humano antes de expandir a auto-send. El cliente pidio evidencia de precision y auditoria.',
    },
    replacementWatch:
      'Vigilar aprobacion legal diaria, confirmar disponibilidad de Megan para el demo del viernes y no comprometer fecha publica hasta tener sandbox validado.',
    nextMeeting: {
      date: '2026-06-04T15:00',
      objective: 'Revisar readiness del piloto y resolver observaciones legales.',
      participants: 'Megan Holt, Daniela Rivas, Sofia Mena, equipo legal cliente',
    },
    internalComments:
      'Buen momentum comercial. Mantener narrativa enfocada en asistencia y trazabilidad, no en automatizacion completa.',
    commentLog: [
      {
        id: 'comment-1',
        message: 'El cliente valoro mucho el comparativo de tiempos con baseline manual. Reutilizar esa slide en el proximo steering.',
        createdAt: '2026-05-29T16:45:00.000Z',
        resolved: true,
      },
      {
        id: 'comment-2',
        message: 'Falta alinear con Infra si el sandbox necesitara allowlist especifica para el proveedor del modelo.',
        createdAt: '2026-05-31T18:10:00.000Z',
        resolved: false,
      },
    ],
  },
  {
    id: 'smart-endpoint-integration',
    name: 'Smart Endpoint Integration',
    client: 'Atlas Logistics',
    initiativeType: 'Smart Endpoints',
    health: 'Rojo',
    nextMilestone: 'UAT de sincronizacion bidireccional',
    nextMilestoneDate: '2026-06-04',
    pmResponsible: 'Javier Benitez',
    pmBackup: 'Marcela Cruz',
    mainRisk: 'El endpoint legado del cliente sigue devolviendo payloads inconsistentes y genera errores intermitentes.',
    assignedPeople: 'PM, Tech Lead, QA, 2 Integration Engineers',
    lastUpdated: now,
    quickComments: 'Necesita escalation tecnica y presion amable al cliente.',
    clientContact: {
      name: 'Andre Patel',
      title: 'Enterprise Systems Manager',
      email: 'apatel@atlaslogistics.example',
      chat: 'WhatsApp',
    },
    currentObjective:
      'Lograr una UAT estable con sincronizacion de ordenes y actualizaciones de estado sin perdida de eventos ni duplicados.',
    teamAssigned: [
      { id: 'team-4', role: 'Tech Lead', name: 'Renato Mejia', dedication: '70%' },
      { id: 'team-5', role: 'Integration Engineer', name: 'Paola Castillo', dedication: '100%' },
      { id: 'team-6', role: 'QA Analyst', name: 'Esteban Lara', dedication: '60%' },
    ],
    milestones: [
      { id: 'mile-3', title: 'Corregir mapping de eventos cancelados', date: '2026-06-02', owner: 'Paola Castillo', status: 'Bloqueado' },
      { id: 'mile-4', title: 'UAT bidireccional', date: '2026-06-04', owner: 'Renato Mejia', status: 'En riesgo' },
    ],
    clientPending: [
      { id: 'cp-3', item: 'Publicar version estable del endpoint /orders/status', dueDate: '2026-06-02', impact: 'Bloquea UAT' },
      { id: 'cp-4', item: 'Asignar owner tecnico para troubleshooting en horario extendido', dueDate: '2026-06-03', impact: 'Reduce tiempo de resolucion' },
    ],
    internalPending: [
      { id: 'ip-3', item: 'Completar logging con correlation ids', dueDate: '2026-06-01', owner: 'Renato Mejia' },
      { id: 'ip-4', item: 'Preparar plan de rollback para UAT', dueDate: '2026-06-03', owner: 'Javier Benitez' },
    ],
    alertsAndRisks:
      'Si el cliente no estabiliza el endpoint hoy, la UAT pierde sentido y hay que renegociar la fecha comprometida al sponsor. Existe riesgo reputacional porque ya se comunico una fecha tentativa.',
    openDecisions:
      'Decidir si seguimos con middleware de normalizacion temporal o si pausamos hasta que el cliente corrija origen. Tambien falta definir quien aprueba excepciones manuales.',
    latestCommunication: {
      date: '2026-05-31',
      summary:
        'El equipo cliente reconocio la inconsistencia de payloads, pero aun no promete fecha fija. Aceptaron daily tecnico de contingencia por tres dias.',
    },
    replacementWatch:
      'Empujar daily tecnico, documentar cada error con ejemplo de payload y preparar mensaje ejecutivo si el hito del jueves se mueve.',
    nextMeeting: {
      date: '2026-06-02T09:30',
      objective: 'Revisar errores del endpoint y definir go/no-go para UAT.',
      participants: 'Andre Patel, Javier Benitez, Renato Mejia, equipo integraciones cliente',
    },
    internalComments:
      'Hay que proteger al equipo tecnico de scope creep. Mantener foco en estabilidad y no aceptar requests nuevos hasta pasar UAT.',
    commentLog: [
      {
        id: 'comment-3',
        message: 'QA detecto duplicados solo cuando el cliente reintenta sin idempotency key; evidencias listas para compartir.',
        createdAt: '2026-05-30T20:05:00.000Z',
        resolved: false,
      },
    ],
  },
  {
    id: 'webflow-corporate-website',
    name: 'Webflow Corporate Website',
    client: 'BluePeak Capital',
    initiativeType: 'Webflow Website',
    health: 'Verde',
    nextMilestone: 'Aprobacion final de homepage y migration plan',
    nextMilestoneDate: '2026-06-10',
    pmResponsible: 'Laura Perdomo',
    pmBackup: 'Andres Cortez',
    mainRisk: 'Pequeno riesgo de retraso si el cliente extiende cambios de copy legal.',
    assignedPeople: 'PM, Designer, Webflow Dev, Copywriter',
    lastUpdated: now,
    quickComments: 'Proyecto ordenado y con sponsor muy participativo.',
    clientContact: {
      name: 'Claire Benson',
      title: 'VP Marketing',
      email: 'cbenson@bluepeakcapital.example',
      chat: 'Slack Connect',
    },
    currentObjective:
      'Cerrar aprobacion ejecutiva del sitio corporativo y dejar lista la migracion de contenido para un launch sin sobresaltos.',
    teamAssigned: [
      { id: 'team-7', role: 'Designer', name: 'Valeria Ortiz', dedication: '50%' },
      { id: 'team-8', role: 'Webflow Developer', name: 'Marco Rivas', dedication: '80%' },
      { id: 'team-9', role: 'Copywriter', name: 'Irene Castro', dedication: '30%' },
    ],
    milestones: [
      { id: 'mile-5', title: 'QA responsive y CMS collections', date: '2026-06-05', owner: 'Marco Rivas', status: 'En progreso' },
      { id: 'mile-6', title: 'Final stakeholder sign-off', date: '2026-06-10', owner: 'Laura Perdomo', status: 'Programado' },
    ],
    clientPending: [
      { id: 'cp-5', item: 'Aprobar copy legal de pagina About', dueDate: '2026-06-07', impact: 'Puede mover launch 2 dias' },
    ],
    internalPending: [
      { id: 'ip-5', item: 'Configurar redirects legacy', dueDate: '2026-06-08', owner: 'Marco Rivas' },
      { id: 'ip-6', item: 'Preparar training CMS para marketing', dueDate: '2026-06-09', owner: 'Laura Perdomo' },
    ],
    alertsAndRisks:
      'Sin riesgos mayores por ahora. Solo vigilar tiempos del equipo legal del cliente para no afectar el cierre.',
    openDecisions:
      'Queda definir si el newsroom ira live en fase 1 o se activara una semana despues del lanzamiento principal.',
    latestCommunication: {
      date: '2026-05-29',
      summary:
        'El sponsor aprobo el nuevo hero y la arquitectura de contenido. Pidieron solo un ajuste menor en la pagina de liderazgo.',
    },
    replacementWatch:
      'Mantener track del copy legal y asegurar que training CMS quede calendarizado antes del launch.',
    nextMeeting: {
      date: '2026-06-06T11:00',
      objective: 'Recorrido final del sitio y validacion del plan de lanzamiento.',
      participants: 'Claire Benson, Laura Perdomo, Valeria Ortiz, Marco Rivas',
    },
    internalComments:
      'Buen caso para usar como referencia interna de ejecucion ordenada. Cliente aprecia respuestas claras y visuales.',
    commentLog: [],
  },
  {
    id: 'wordpress-support-retainer',
    name: 'Wordpress Support Retainer',
    client: 'Harbor Legal Group',
    initiativeType: 'Wordpress Website',
    health: 'Amarillo',
    nextMilestone: 'Cierre del backlog de soporte Q2',
    nextMilestoneDate: '2026-06-12',
    pmResponsible: 'Camila Moran',
    pmBackup: 'Andres Cortez',
    mainRisk: 'El backlog mezcla soporte y mejoras fuera de alcance; si no se ordena, afecta capacidad del equipo.',
    assignedPeople: 'PM, Wordpress Dev, QA part-time',
    lastUpdated: now,
    quickComments: 'Cliente contento, pero acostumbra pedir urgencias por chat.',
    clientContact: {
      name: 'Rebecca Lin',
      title: 'Marketing Operations Lead',
      email: 'rlin@harborlegal.example',
      chat: 'WhatsApp',
    },
    currentObjective:
      'Cerrar el backlog comprometido del trimestre y establecer una regla mas clara entre soporte reactivo y solicitudes evolutivas.',
    teamAssigned: [
      { id: 'team-10', role: 'Wordpress Developer', name: 'Nicolas Ayala', dedication: '65%' },
      { id: 'team-11', role: 'QA Analyst', name: 'Daniela Cea', dedication: '20%' },
    ],
    milestones: [
      { id: 'mile-7', title: 'Release de fixes SEO y forms', date: '2026-06-04', owner: 'Nicolas Ayala', status: 'En progreso' },
      { id: 'mile-8', title: 'QBR de retainer y prioridades Q3', date: '2026-06-12', owner: 'Camila Moran', status: 'Programado' },
    ],
    clientPending: [
      { id: 'cp-6', item: 'Priorizar backlog de mejoras solicitado por partners', dueDate: '2026-06-05', impact: 'Evita confusiones de alcance' },
    ],
    internalPending: [
      { id: 'ip-7', item: 'Separar tickets evolutivos del board de soporte', dueDate: '2026-06-03', owner: 'Camila Moran' },
      { id: 'ip-8', item: 'Publicar SLA visible para requests por chat', dueDate: '2026-06-06', owner: 'Camila Moran' },
    ],
    alertsAndRisks:
      'Riesgo medio de desgaste operativo si se siguen atendiendo urgencias no planificadas sin priorizacion semanal.',
    openDecisions:
      'Definir si el cliente compra horas adicionales para mejoras de CRO o si se pasa esa conversacion a nuevo mini-proyecto.',
    latestCommunication: {
      date: '2026-05-30',
      summary:
        'Rebecca confirmo satisfaccion con los fixes recientes, pero pidio mas visibilidad del backlog y tiempos estimados por ticket.',
    },
    replacementWatch:
      'Cuidar el manejo de expectativas y llevar toda urgencia a tablero antes de comprometer tiempos por WhatsApp.',
    nextMeeting: {
      date: '2026-06-05T13:00',
      objective: 'Revisar backlog, SLA y propuesta de priorizacion para junio.',
      participants: 'Rebecca Lin, Camila Moran, Nicolas Ayala',
    },
    internalComments:
      'Conviene convertir este retainer en caso piloto para reportes semanales estandarizados de mantenimiento.',
    commentLog: [
      {
        id: 'comment-4',
        message: 'El cliente responde mejor cuando ve una lista corta de prioridades. Evitar mandar backlog completo sin agrupacion.',
        createdAt: '2026-05-28T15:15:00.000Z',
        resolved: false,
      },
    ],
  },
]
