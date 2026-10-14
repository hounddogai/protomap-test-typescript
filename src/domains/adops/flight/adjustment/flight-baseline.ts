import * as text from "../../../../kit/text.js";

/** Where a flight baseline is in its life cycle. */
export type FlightBaselineStatus = "created" | "validated" | "published" | "retired";

/** One flight baseline, with what the planners need to act on it. */
export class FlightBaseline {
  code: string;
  name: string;
  title: string;
  audienceId: string;
  ratio: number;
  campaignRef: string;
  margin: number;
  rate: number;
  score: number;
  clicks: number;
  status: FlightBaselineStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    audienceId: string,
    ratio: number,
    campaignRef: string,
    margin: number,
    rate: number,
    score: number,
    clicks: number,
    status: FlightBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
    this.margin = margin;
    this.rate = rate;
    this.score = score;
    this.clicks = clicks;
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

  canMoveTo(next: FlightBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.clicks + this.ratio) * 100) / 100;
  }

  copy(): FlightBaseline {
    return new FlightBaseline(
      this.code,
      this.name,
      this.title,
      this.audienceId,
      this.ratio,
      this.campaignRef,
      this.margin,
      this.rate,
      this.score,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a flight baseline in status created. */
export function newFlightBaseline(code: string, name: string): FlightBaseline {
  return new FlightBaseline(code, name, "", "", 0, "", 0, 0, 0, 0, "created");
}
