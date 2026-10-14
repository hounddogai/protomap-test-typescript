import * as text from "../../../../kit/text.js";

/** Where a default activation template is in its life cycle. */
export type DefaultActivationTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default activation template as the activation team keeps it. */
export class DefaultActivationTemplate {
  code: string;
  title: string;
  batchSize: number;
  campaignRef: string;
  startsAt: number;
  utmSource: string;
  clicks: number;
  description: string;
  channel: string;
  label: string;
  locale: string;
  status: DefaultActivationTemplateStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    campaignRef: string,
    startsAt: number,
    utmSource: string,
    clicks: number,
    description: string,
    channel: string,
    label: string,
    locale: string,
    status: DefaultActivationTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.clicks = clicks;
    this.description = description;
    this.channel = channel;
    this.label = label;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultActivationTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultActivationTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default activation template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default activation template"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.batchSize * this.startsAt * 100) / 100;
  }

  copy(): DefaultActivationTemplate {
    return new DefaultActivationTemplate(
      this.code,
      this.title,
      this.batchSize,
      this.campaignRef,
      this.startsAt,
      this.utmSource,
      this.clicks,
      this.description,
      this.channel,
      this.label,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default activation template in status planned. */
export function newDefaultActivationTemplate(code: string, title: string): DefaultActivationTemplate {
  return new DefaultActivationTemplate(code, title, 0, "", 0, "", 0, "", "", "", "", "planned");
}
