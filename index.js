require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_NAME = process.env.CHANNEL_NAME;
const BOT_TOKEN = process.env.BOT_TOKEN;

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const images = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbgZ__LdsiVoCkP52yuMeVa0tCcYl-iB0Auw&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4tppsTiYKRWB0jqJ1PCKofvXFewUOS2yOvg&s',
    'https://preview.redd.it/%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-v0-3bomrdtd4dpa1.jpg?width=1080&crop=smart&auto=webp&s=9b7988a29aae0c817b143b0810b0b4e136cfa895',
    'https://i.pinimg.com/736x/0a/6f/8d/0a6f8d77b9bb7e56bf4a494cef9b3ff9.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtBHB0d48-SGSlHrLHrsmgaYGObQMXq-7_og&s',
    'https://media.tenor.com/71-zPuxWISIAAAAe/%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-good-morning.png',
    'https://pbs.twimg.com/media/Fr6hCm1X0AAe_LS.jpg',
    'https://i.pinimg.com/736x/47/79/e6/4779e6e3c501c0cd0de16e128293a5e7.jpg',
    'https://pbs.twimg.com/media/EXB3uq0XQAEvMIo.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ723WMh9HCLtUYeOM6gQ8pTARRpc1WIz3J8A&s',
    'https://i.pinimg.com/474x/7e/cd/01/7ecd01e09b58d8a36e04b3c090cbc550.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSVCTQ6W9R-YNfWfAMfKarTuOUL8NswhVB9A&s',
    'https://pbs.twimg.com/media/GIZjKFCXYAABS3i.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9ZBkRJ-p37hr6veW_J9kGvjzi-F-K1GEXGQ&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE5zUFiCoA-Bi4T79gRFTZeKGzpCTniYnrGA&s',
    'https://preview.redd.it/ramadan-new-collection-2024-v0-t5p8jvhiepoc1.jpg?width=640&crop=smart&auto=webp&s=9e9410ba5da47e55ad42fc1339ec252523a499ad',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw26j5AQFcK1q6TRyyCqUeolm5VlwNn9xE8w&s',
    'https://i.redd.it/cjshkftawwoc1.jpeg',
    'https://preview.redd.it/thread-%D8%AA%D9%85-%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9-%D8%A7%D9%84%D9%83%D8%B1%D8%B4-%D8%A8%D9%86%D8%AC%D8%A7%D8%AD-v0-lis3z96d0joc1.jpeg?width=720&format=pjpg&auto=webp&s=0a1163f2a11c37e1149832f0115a340d516738db',
    'https://www.meme-arsenal.com/memes/0c6bf3215d19acffcbe63bc339c2bd7c.jpg',
];
let currentDay = 9;
let prayerTimes = null;

async function getPrayerTimes() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity/${today}?country=EG&city=Cairo`);
        prayerTimes = response.data.data.timings;
    } catch (error) {
        console.error('خطأ في جلب أوقات الصلاة:', error);
    }
}

function addMinutes(time, minutesToAdd) {
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + minutesToAdd;
    let newHours = Math.floor(totalMinutes / 60) % 24;
    let newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

function subtractMinutes(time, minutesToSubtract) {
    let [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes - minutesToSubtract;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    let newHours = Math.floor(totalMinutes / 60);
    let newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    async function findChannelByName(guild, name) {
        return guild.channels.cache.find(channel => channel.name === name);
    }

    async function scheduleMessages() {
        await getPrayerTimes();
        if (!prayerTimes) return;

        const maghribTime = prayerTimes.Maghrib;
        const postTime = addMinutes(maghribTime, 30);
        const fajrTime = prayerTimes.Fajr;
        const sahoorTime = subtractMinutes(fajrTime, 90);

        const sentMessages = new Set(); // لمنع التكرار

        cron.schedule(`0 ${maghribTime.split(':')[1]} ${maghribTime.split(':')[0]} * * *`, async () => {
            if (currentDay < 29 && !sentMessages.has(`iftar_${currentDay}`)) {
                for (const guild of client.guilds.cache.values()) {
                    const channel = await findChannelByName(guild, CHANNEL_NAME);
                    if (channel) channel.send("(اللهم لكَ صمت وعلى رزقك أفطرت، ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله)");
                }
                sentMessages.add(`iftar_${currentDay}`);
                currentDay++;
            }
        }, { timezone: 'Africa/Cairo' });

        cron.schedule(`0 ${postTime.split(':')[1]} ${postTime.split(':')[0]} * * *`, async () => {
            if (currentDay <= 29 && !sentMessages.has(`image_${currentDay}`)) {
                for (const guild of client.guilds.cache.values()) {
                    const channel = await findChannelByName(guild, CHANNEL_NAME);
                    if (channel) channel.send(images[currentDay]);
                }
                sentMessages.add(`image_${currentDay}`);
            }
        }, { timezone: 'Africa/Cairo' });

        cron.schedule(`0 ${sahoorTime.split(':')[1]} ${sahoorTime.split(':')[0]} * * *`, async () => {
            for (const guild of client.guilds.cache.values()) {
                const channel = await findChannelByName(guild, CHANNEL_NAME);
                if (channel) channel.send({ files: ["./sahoor_video.mp4"] });
            }
        }, { timezone: 'Africa/Cairo' });

        console.log(`Messages scheduled for Maghrib (${maghribTime}), Iftar Image (${postTime}), and Sahoor Reminder (${sahoorTime}).`);
    }

    await scheduleMessages();

    cron.schedule('0 0 * * *', async () => {
        console.log("Updating daily prayer times...");
        await scheduleMessages();
    }, { timezone: 'Africa/Cairo' });
});

client.login(BOT_TOKEN);

