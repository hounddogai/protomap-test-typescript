import * as text from "../../../../kit/text.js";

/** Where a rolling path template is in its life cycle. */
export type RollingPathTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a rolling path template and its current status. */
export class RollingPathTemplate {
  code: string;
  name: string;
  floorValue: number;
  category: string;
  expiresAt: number;
  active: boolean;
  locale: string;
  tags: string[];
  revision: number;
  channel: string;
  status: RollingPathTemplateStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    category: string,
    expiresAt: number,
    active: boolean,
    locale: string,
    tags: string[],
    revision: number,
    channel: string,
    status: RollingPathTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.category = category;
    this.expiresAt = expiresAt;
    this.active = active;
    this.locale = locale;
    this.tags = tags;
    this.revision = revision;
    this.channel = channel;
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

  canMoveTo(next: RollingPathTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPathTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling path template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.expiresAt * this.floorValue * 100) / 100;
  }

  copy(): RollingPathTemplate {
    return new RollingPathTemplate(
      this.code,
      this.name,
      this.floorValue,
      this.category,
      this.expiresAt,
      this.active,
      this.locale,
      this.tags,
      this.revision,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling path template in status planned. */
export function newRollingPathTemplate(code: string, name: string): RollingPathTemplate {
  return new RollingPathTemplate(code, name, 0, "", 0, false, "", [], 0, "", "planned");
}
