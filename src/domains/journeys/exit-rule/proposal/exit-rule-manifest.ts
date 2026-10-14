import * as text from "../../../../kit/text.js";

/** Where a exit rule manifest is in its life cycle. */
export type ExitRuleManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One exit rule manifest, with what the planners need to act on it. */
export class ExitRuleManifest {
  code: string;
  title: string;
  locale: string;
  phone: string;
  startsAt: number;
  active: boolean;
  limit: number;
  notes: string;
  visible: boolean;
  durationMinutes: number;
  unit: string;
  status: ExitRuleManifestStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    phone: string,
    startsAt: number,
    active: boolean,
    limit: number,
    notes: string,
    visible: boolean,
    durationMinutes: number,
    unit: string,
    status: ExitRuleManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.phone = phone;
    this.startsAt = startsAt;
    this.active = active;
    this.limit = limit;
    this.notes = notes;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.unit = unit;
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

  canMoveTo(next: ExitRuleManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round((this.limit + this.durationMinutes) * 100) / 100;
  }

  copy(): ExitRuleManifest {
    return new ExitRuleManifest(
      this.code,
      this.title,
      this.locale,
      this.phone,
      this.startsAt,
      this.active,
      this.limit,
      this.notes,
      this.visible,
      this.durationMinutes,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a exit rule manifest in status new. */
export function newExitRuleManifest(code: string, title: string): ExitRuleManifest {
  return new ExitRuleManifest(code, title, "", "", 0, false, 0, "", false, 0, "", "new");
}
