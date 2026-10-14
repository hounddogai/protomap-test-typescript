import { GlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

/** How screens and exports show a global retention checkpoint. */
export class GlobalRetentionCheckpointView {
  code: string;
  title: string;
  unit: string;
  versionText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    unit: string,
    versionText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.versionText = versionText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionCheckpointView(item: GlobalRetentionCheckpoint): GlobalRetentionCheckpointView {
  return new GlobalRetentionCheckpointView(
    item.code,
    item.title,
    item.unit,
    String(item.version),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionCheckpointViews(items: GlobalRetentionCheckpoint[]): GlobalRetentionCheckpointView[] {
  const views: GlobalRetentionCheckpointView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionCheckpointView(item));
  }
  return views;
}

export function sumGlobalRetentionCheckpointView(view: GlobalRetentionCheckpointView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedVersion + parsedPriority;
}
