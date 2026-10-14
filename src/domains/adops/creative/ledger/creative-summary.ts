import * as text from "../../../../kit/text.js";

/** Where a creative summary is in its life cycle. */
export type CreativeSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One creative summary, with what the planners need to act on it. */
export class CreativeSummary {
  code: string;
  name: string;
  startsAt: number;
  attributes: Map<string, string>;
  locale: string;
  discount: number;
  summary: string;
  segment: string;
  ownerId: string;
  retries: number;
  channel: string;
  status: CreativeSummaryStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    attributes: Map<string, string>,
    locale: string,
    discount: number,
    summary: string,
    segment: string,
    ownerId: string,
    retries: number,
    channel: string,
    status: CreativeSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.locale = locale;
    this.discount = discount;
    this.summary = summary;
    this.segment = segment;
    this.ownerId = ownerId;
    this.retries = retries;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreativeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"creative summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round(this.startsAt * this.discount * 100) / 100;
  }

  copy(): CreativeSummary {
    return new CreativeSummary(
      this.code,
      this.name,
      this.startsAt,
      this.attributes,
      this.locale,
      this.discount,
      this.summary,
      this.segment,
      this.ownerId,
      this.retries,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative summary in status new. */
export function newCreativeSummary(code: string, name: string): CreativeSummary {
  return new CreativeSummary(code, name, 0, new Map<string, string>(), "", 0, "", "", "", 0, "", "new");
}
