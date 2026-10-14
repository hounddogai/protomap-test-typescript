import * as text from "../../../../kit/text.js";

/** Where a strict funnel bundle is in its life cycle. */
export type StrictFunnelBundleStatus = "created" | "validated" | "published" | "retired";

/** A strict funnel bundle as the funnel team keeps it. */
export class StrictFunnelBundle {
  code: string;
  title: string;
  cohort: string;
  description: string;
  impressions: number;
  summary: string;
  channel: string;
  status: StrictFunnelBundleStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    description: string,
    impressions: number,
    summary: string,
    channel: string,
    status: StrictFunnelBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.description = description;
    this.impressions = impressions;
    this.summary = summary;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictFunnelBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictFunnelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict funnel bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict funnel bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): StrictFunnelBundle {
    return new StrictFunnelBundle(
      this.code,
      this.title,
      this.cohort,
      this.description,
      this.impressions,
      this.summary,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict funnel bundle in status created. */
export function newStrictFunnelBundle(code: string, title: string): StrictFunnelBundle {
  return new StrictFunnelBundle(code, title, "", "", 0, "", "", "created");
}
