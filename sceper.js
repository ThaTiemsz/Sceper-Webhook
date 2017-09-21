const { WebhookClient, RichEmbed } = require("discord.js")
const fs = require("fs")
const config = require("./config")
const data = require("./data")
const webhook = new WebhookClient(config.id, config.token, { disableEveryone: true })
const RSSFeedEmitter = require("rss-feed-emitter")
const feed = new RSSFeedEmitter()

const decodeHTMLEntities = str => str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
exports.initial = true

feed.add({ url: "http://sceper.ws/feed", refresh: 120000 }) // every 2 minutes
feed.on("new-item", async item => {
    if (data.feed.includes(item.guid)) {
        return
    } else {
        data.feed.push(item.guid)
        await fs.writeFileSync("./data", data)
    }
    let categories = item.categories.join("| ")
    if (!categories.includes("TV") || !categories.includes("Movie")) return // filter to only TV shows or Movies
    let color = categories.includes("TV") ? "AQUA" : categories.includes("Movie") ? "PURPLE" : "GREY"
    let description = decodeHTMLEntities(item.description)
    let clearRegex = /(Release Info|Release Description.+)/gi
    description = description.replace(clearRegex, "")
    let badRegex = /((?:Release Group|Release Name|Release Date|Filename|Source|Size|Genre|Video|Audio|Subs|IMDB Rating|Runtime|Episode|Season & Episode|RT Critics|Directed By|Starring):)/gi
    description = description.replace(badRegex, "\n**$&**") // formatting

    const embed = RichEmbed()
        .setAuthor(categories)
        .setTitle(item.title)
        .setURL(item.link)
        .setColor(color)
        .setDescription(description)
        .setTimestamp(item.pubDate)

    webhook.send("", { embed })
})

process.on("unhandledRejection", err => console.log(err))