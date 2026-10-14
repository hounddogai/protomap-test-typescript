import { PostCycle } from "./post-cycle.js";

/** How screens and exports show a post cycle. */
export class PostCycleView {
  codeText: string;
  title: string;
  rate: string;
  version: string;
  clicks: string;
  durationMinutesText: string;
  expiresAt: string;
  scoreText: string;
  channelText: string;
  nameText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rate: string,
    version: string,
    clicks: string,
    durationMinutesText: string,
    expiresAt: string,
    scoreText: string,
    channelText: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rate = rate;
    this.version = version;
    this.clicks = clicks;
    this.durationMinutesText = durationMinutesText;
    this.expiresAt = expiresAt;
    this.scoreText = scoreText;
    this.channelText = channelText;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toPostCycleView(item: PostCycle): PostCycleView {
  return new PostCycleView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    String(item.version),
    String(item.clicks),
    String(item.durationMinutes),
    String(item.expiresAt),
    item.score.toFixed(2),
    item.channel,
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostCycleViews(items: PostCycle[]): PostCycleView[] {
  const views: PostCycleView[] = [];
  for (const item of items) {
    views.push(toPostCycleView(item));
  }
  return views;
}

export function sumPostCycleView(view: PostCycleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedRate + parsedVersion + parsedClicks;
}
