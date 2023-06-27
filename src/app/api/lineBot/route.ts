import {NextApiResponse} from "next";
import {Client, WebhookEvent} from "@line/bot-sdk";
import {NextRequest} from "next/server";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
}

const client = new Client(config)

export async function POST(req: NextRequest, res: NextApiResponse) {
    const body = await req.text()
    const bodyObj = JSON.parse(body)
    const events: WebhookEvent[] = bodyObj.events

    try {
        await Promise.all(events.map(handleEvent))
    } catch (e) {
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event)
}