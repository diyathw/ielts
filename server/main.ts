import "reflect-metadata"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { join } from "node:path"
import { AppModule } from "./module"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.setGlobalPrefix("api")
  app.useStaticAssets(join(process.cwd(), "dist"))
  const port = Number(process.env.PORT || 5173)
  await app.listen(port, "127.0.0.1")
  console.log(`IELTS app ready at http://127.0.0.1:${port}`)
}

bootstrap()
