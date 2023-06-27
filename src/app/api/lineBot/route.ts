import {NextApiRequest, NextApiResponse} from "next";
import {Client, WebhookEvent} from "@line/bot-sdk";

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? 'YC+cfiwLguKTIdyYtO/96eHhMoCbVaVtn4mdfjVs+Uu7QvS+2xbP1xo1OxCqKEWNjG/0Z19fVtbg9ZBgmdLyCNF4ioPi72gQd9YN99qKToIG9y3rHXYj1wiAHUI2gc7ojwUMAxtFveNZN+AKSqNjFAdB04t89/1O/w1cDnyilFU=',
    channelSecret: process.env.LINE_CHANNEL_SECRET ?? 'd3f86cb1d0d4b8f434f55a2cf7335683',
}

const client = new Client(config)

interface reqBodyType extends NextApiRequest{
    body: {
        events: WebhookEvent[]
    }
}

export async function POST(req: reqBodyType, res: NextApiResponse) {
    const events: WebhookEvent[] = req.body.events

    try {
        await Promise.all(events.map(handleEvent))
    } catch (e) {
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

async function handleEvent(event: WebhookEvent) {
    console.log(event)
}