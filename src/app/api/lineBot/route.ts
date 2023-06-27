import {NextApiResponse} from "next";
import {Client, WebhookEvent} from "@line/bot-sdk";
import {NextRequest, NextResponse} from "next/server";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
}

const client = new Client(config)

export async function POST(req: NextRequest, res: NextApiResponse) {
    console.log(1, req)
    const body = await req.text()
    console.log(2, body)
    const bodyObj = JSON.parse(body)
    console.log(3, bodyObj)
    const events: WebhookEvent[] = bodyObj.events
    console.log(4, events)
    try {
        await Promise.all(events.map(handleEvent))
        console.log(5)
    } catch (e) {
        console.log(6, e)
        return NextResponse.json({ error: 'Internal Server Error: ' + e })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event)
}