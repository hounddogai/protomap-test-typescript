import { LeaderboardTemplate } from "./leaderboard-template.js";

/** How screens and exports show a leaderboard template. */
export class LeaderboardTemplateView {
  code: string;
  name: string;
  region: string;
  batchSize: string;
  createdAt: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    batchSize: string,
    createdAt: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardTemplateView(item: LeaderboardTemplate): LeaderboardTemplateView {
  return new LeaderboardTemplateView(
    item.code,
    item.name,
    item.region,
    String(item.batchSize),
    String(item.createdAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardTemplateViews(items: LeaderboardTemplate[]): LeaderboardTemplateView[] {
  const views: LeaderboardTemplateView[] = [];
  for (const item of items) {
    views.push(toLeaderboardTemplateView(item));
  }
  return views;
}

export function sumLeaderboardTemplateView(view: LeaderboardTemplateView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBatchSize + parsedCreatedAt + parsedDurationMinutes;
}
