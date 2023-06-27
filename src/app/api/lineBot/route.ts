import {NextApiResponse} from "next";
import {Client, WebhookEvent} from "@line/bot-sdk";
import {NextResponse} from "next/server";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
}

const client = new Client(config)

export async function POST(req: Request, _: NextApiResponse) {
    const body = await readStream(req.body)
    const events: WebhookEvent[] = JSON.parse(body).events
    console.log(4, events)
    try {
        await Promise.all(events.map(handleEvent))
        return NextResponse.json({ status: 'OK' })
    } catch (e) {
        return NextResponse.json({ status: 'FAIL', message: 'Internal Server Error: ' + e })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event.type)
    if (event.type === 'message') {
        const message = event.message
        console.log(message)
        if (message.type === 'text') {
            console.log(message.text)
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: `你是不是講了 ${message.text}`
            })
        }
    }
}

async function readStream(stream: ReadableStream | null): Promise<string> {
    if (!stream) return ''
    const reader = stream.getReader()
    let result = ''
    const decoder = new TextDecoder()
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        result += chunk
    }
    return result
}