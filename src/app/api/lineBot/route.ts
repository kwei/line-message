import {NextApiResponse} from "next";
import {Client, WebhookEvent} from "@line/bot-sdk";
import {NextRequest, NextResponse} from "next/server";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
}

const client = new Client(config)

export async function POST(req: NextRequest, res: NextApiResponse) {
    console.log(config)
    const body = await req.text()
    const bodyObj = JSON.parse(body)
    const events: WebhookEvent[] = bodyObj.events

    try {
        await Promise.all(events.map(handleEvent))
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error: ' + e })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event)
}