import * as text from "../../../../kit/text.js";

/** Where a frequency profile is in its life cycle. */
export type FrequencyProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A frequency profile. Its code is unique within a tenant. */
export class FrequencyProfile {
  code: string;
  title: string;
  durationMinutes: number;
  maximum: number;
  label: string;
  visible: boolean;
  createdAt: number;
  status: FrequencyProfileStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    maximum: number,
    label: string,
    visible: boolean,
    createdAt: number,
    status: FrequencyProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
    this.label = label;
    this.visible = visible;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FrequencyProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.createdAt + this.maximum) * 100) / 100;
  }

  copy(): FrequencyProfile {
    return new FrequencyProfile(
      this.code,
      this.title,
      this.durationMinutes,
      this.maximum,
      this.label,
      this.visible,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a frequency profile in status open. */
export function newFrequencyProfile(code: string, title: string): FrequencyProfile {
  return new FrequencyProfile(code, title, 0, 0, "", false, 0, "open");
}
