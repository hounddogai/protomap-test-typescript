import { RollingMentionRecord } from "./rolling-mention-record.js";

/** How screens and exports show a rolling mention record. */
export class RollingMentionRecordView {
  code: string;
  name: string;
  priority: string;
  visible: string;
  endsAt: string;
  statusLabel: string;

  constructor(code: string, name: string, priority: string, visible: string, endsAt: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.visible = visible;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toRollingMentionRecordView(item: RollingMentionRecord): RollingMentionRecordView {
  return new RollingMentionRecordView(
    item.code,
    item.name,
    String(item.priority),
    `${item.visible}`,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingMentionRecordViews(items: RollingMentionRecord[]): RollingMentionRecordView[] {
  const views: RollingMentionRecordView[] = [];
  for (const item of items) {
    views.push(toRollingMentionRecordView(item));
  }
  return views;
}

export function sumRollingMentionRecordView(view: RollingMentionRecordView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedPriority + parsedEndsAt;
}
