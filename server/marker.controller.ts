import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common"
import { MarkerService } from "./marker.service"

@Controller()
export class MarkerController {
  constructor(private readonly marker: MarkerService) {}

  @Get("health")
  health() {
    return { ok: true }
  }

  @Post("mark")
  async mark(@Body() data: unknown) {
    if (!data || typeof data !== "object") throw new BadRequestException("Enter a question and essay.")
    const input = data as Record<string, unknown>
    const task = input.task
    const prompt = typeof input.prompt === "string" ? input.prompt.trim() : ""
    const essay = typeof input.essay === "string" ? input.essay.trim() : ""
    if ((task !== "Task 1" && task !== "Task 2") || !prompt || !essay) {
      throw new BadRequestException("Choose a task and enter the question and essay.")
    }
    if (prompt.length > 4000 || essay.length > 20000) {
      throw new BadRequestException("The question or essay is too long.")
    }
    return this.marker.mark({ task, prompt, essay })
  }
}
