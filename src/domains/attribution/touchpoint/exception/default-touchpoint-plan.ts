import * as text from "../../../../kit/text.js";

/** Where a default touchpoint plan is in its life cycle. */
export type DefaultTouchpointPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default touchpoint plan. Its code is unique within a tenant. */
export class DefaultTouchpointPlan {
  code: string;
  name: string;
  durationMinutes: number;
  summary: string;
  audienceId: string;
  updatedAt: number;
  status: DefaultTouchpointPlanStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    summary: string,
    audienceId: string,
    updatedAt: number,
    status: DefaultTouchpointPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.summary = summary;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: DefaultTouchpointPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultTouchpointPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default touchpoint plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round((this.durationMinutes - this.updatedAt) * 100) / 100;
  }

  copy(): DefaultTouchpointPlan {
    return new DefaultTouchpointPlan(
      this.code,
      this.name,
      this.durationMinutes,
      this.summary,
      this.audienceId,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default touchpoint plan in status planned. */
export function newDefaultTouchpointPlan(code: string, name: string): DefaultTouchpointPlan {
  return new DefaultTouchpointPlan(code, name, 0, "", "", 0, "planned");
}
