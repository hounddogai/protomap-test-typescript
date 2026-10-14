import * as text from "../../../../kit/text.js";

/** Where a journey summary is in its life cycle. */
export type JourneySummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey summary as the journey team keeps it. */
export class JourneySummary {
  code: string;
  name: string;
  pinned: boolean;
  locale: string;
  utmSource: string;
  openRate: number;
  source: string;
  title: string;
  country: string;
  status: JourneySummaryStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    locale: string,
    utmSource: string,
    openRate: number,
    source: string,
    title: string,
    country: string,
    status: JourneySummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.locale = locale;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.source = source;
    this.title = title;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneySummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: JourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"journey summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): JourneySummary {
    return new JourneySummary(
      this.code,
      this.name,
      this.pinned,
      this.locale,
      this.utmSource,
      this.openRate,
      this.source,
      this.title,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a journey summary in status idle. */
export function newJourneySummary(code: string, name: string): JourneySummary {
  return new JourneySummary(code, name, false, "", "", 0, "", "", "", "idle");
}
