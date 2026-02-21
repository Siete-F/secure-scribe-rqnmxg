import type { Recording } from '@/types';
import { getRecordingsByProject } from './recordings';
import { getProjectById } from './projects';

/** Export completed recordings as a CSV string */
export async function exportProjectCSV(projectId: string): Promise<string> {
  const recordings = await getRecordingsByProject(projectId);
  const doneRecordings = recordings.filter((r) => r.status === 'done');
  const project = await getProjectById(projectId);

  // Get unique custom field names
  const customFieldNames = new Set<string>();
  doneRecordings.forEach((r) => {
    if (r.customFieldValues) {
      Object.keys(r.customFieldValues).forEach((key) => customFieldNames.add(key));
    }
  });
  const customFieldArray = Array.from(customFieldNames).sort();

  // Build CSV header
  const headers = [
    'Date',
    'Time',
    ...customFieldArray,
    'Transcription Length',
    'Anonymized',
    'LLM Output',
    'Status',
  ];

  const csvLines: string[] = [escapeCSVLine(headers)];

  doneRecordings.forEach((recording) => {
    const createdAt = new Date(recording.createdAt);
    const date = createdAt.toISOString().split('T')[0];
    const time = createdAt.toISOString().split('T')[1]?.substring(0, 8) || '';

    const customValues = customFieldArray.map((field) => {
      const value = recording.customFieldValues?.[field];
      return value !== undefined ? String(value) : '';
    });

    const transcriptionLength = recording.transcription?.length || 0;
    const isAnonymized = recording.anonymizedTranscription ? 'Yes' : 'No';
    const llmOutput = recording.llmOutput || '';

    const row = [
      date,
      time,
      ...customValues,
      String(transcriptionLength),
      isAnonymized,
      llmOutput,
      recording.status,
    ];

    csvLines.push(escapeCSVLine(row));
  });

  return csvLines.join('\n');
}

/** Export completed recordings as a JSON object */
export async function exportProjectJSON(projectId: string): Promise<any> {
  const recordings = await getRecordingsByProject(projectId);
  const doneRecordings = recordings.filter((r) => r.status === 'done');
  const project = await getProjectById(projectId);

  return {
    project: {
      id: project?.id,
      name: project?.name,
      description: project?.description,
      llmProvider: project?.llmProvider,
      llmModel: project?.llmModel,
      exportDate: new Date().toISOString(),
    },
    recordingCount: doneRecordings.length,
    recordings: doneRecordings.map((recording) => ({
      id: recording.id,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      customFieldValues: recording.customFieldValues,
      transcription: recording.transcription,
      anonymizedTranscription: recording.anonymizedTranscription,
      llmOutput: recording.llmOutput,
    })),
  };
}

function escapeCSVLine(values: string[]): string {
  return values
    .map((value) => {
      if (!value) return '""';
      const escaped = String(value).replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    })
    .join(',');
}
