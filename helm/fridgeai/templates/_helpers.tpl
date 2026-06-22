{{- define "fridgeai.labels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
app.kubernetes.io/part-of: fridgeai
helm.sh/chart: {{ .root.Chart.Name }}-{{ .root.Chart.Version }}
{{- end -}}

{{- define "fridgeai.selectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
{{- end -}}

{{- define "fridgeai.secretName" -}}
{{- if .Values.secrets.existingSecret -}}
{{ .Values.secrets.existingSecret }}
{{- else -}}
{{ .Release.Name }}-secrets
{{- end -}}
{{- end -}}

{{- define "fridgeai.springEnv" -}}
- name: SPRING_DATASOURCE_URL
  value: "jdbc:postgresql://{{ .Values.postgres.service.name }}:{{ .Values.postgres.service.port }}/{{ .Values.postgres.auth.database }}"
- name: SPRING_DATASOURCE_USERNAME
  value: {{ .Values.postgres.auth.username | quote }}
- name: SPRING_DATASOURCE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "fridgeai.secretName" . }}
      key: POSTGRES_PASSWORD
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "fridgeai.secretName" . }}
      key: JWT_SECRET
{{- end -}}

{{- define "fridgeai.probeAction" -}}
{{- if eq .probe.type "http" }}
httpGet:
  path: {{ .probe.path | default "/" }}
  port: {{ .port }}
{{- else }}
tcpSocket:
  port: {{ .port }}
{{- end }}
{{- end -}}

{{- define "fridgeai.startupProbe" -}}
{{- include "fridgeai.probeAction" . }}
failureThreshold: {{ .probe.startupFailureThreshold | default 30 }}
periodSeconds: {{ .probe.startupPeriodSeconds | default 5 }}
{{- end -}}

{{- define "fridgeai.probe" -}}
{{- include "fridgeai.probeAction" . }}
periodSeconds: {{ .probe.periodSeconds | default 10 }}
{{- end -}}
