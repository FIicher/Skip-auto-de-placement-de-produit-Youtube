// ==UserScript==
// @name         Auto Skip Sponsor - YouTube (SponsorBlock API)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Skip automatiquement les passages sponsorisés des vidéos YouTube grâce à SponsorBlock
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Utilise l’API officielle SponsorBlock
    const API_URL = "https://sponsor.ajay.app/api/skipSegments?videoID=";

    let lastVideoID = null;
    let sponsorSegments = [];

    function getVideoID() {
        const url = new URL(location.href);
        return url.searchParams.get("v");
    }

    async function fetchSponsorSegments(videoID) {
        try {
            const res = await fetch(API_URL + videoID);
            const data = await res.json();
            sponsorSegments = [];

            data.forEach(segment => {
                if (segment.category.includes("sponsor")) {
                    sponsorSegments.push({
                        start: segment.segment[0],
                        end: segment.segment[1]
                    });
                }
            });

            console.log("🎯 Segments sponsor détectés :", sponsorSegments);
        } catch (e) {
            console.error("Erreur SponsorBlock", e);
        }
    }

    function checkAndSkip() {
        const video = document.querySelector("video");
        if (!video || sponsorSegments.length === 0) return;

        const currentTime = video.currentTime;

        for (const segment of sponsorSegments) {
            if (currentTime >= segment.start && currentTime <= segment.end) {
                console.log(`⏭️ Passage sponsor détecté (${segment.start} → ${segment.end}), skip…`);
                video.currentTime = segment.end;
            }
        }
    }

    function observer() {
        const id = getVideoID();
        if (!id) return;

        if (id !== lastVideoID) {
            lastVideoID = id;
            fetchSponsorSegments(id);
        }
    }

    // Détection changement de page (YouTube utilise le SPA)
    const observerConfig = { subtree: true, childList: true };
    const pageObserver = new MutationObserver(observer);
    pageObserver.observe(document.body, observerConfig);

    // Vérification permanente pour skip
    setInterval(checkAndSkip, 500);
})();
