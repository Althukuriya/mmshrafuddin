// js/youtube.js
const YOUTUBE_API_KEY = 'YOUR_API_KEY'; // Replace with actual API key
const CHANNEL_ID = 'YOUR_CHANNEL_ID'; // Replace with your channel ID

async function fetchYouTubeVideos() {
    try {
        // For demo, using placeholder data
        const videos = [
            {
                id: 'vid1',
                title: '2023 Honda Civic Review',
                thumbnail: 'https://youtu.be/JfYui0H1gRk?si=x0_Zb-WL_35lHkuh',
                videoId: 'https://youtu.be/JfYui0H1gRk?si=x0_Zb-WL_35lHkuh'
            },
            {
                id: 'vid2',
                title: 'Yamaha R15 V4 Test Ride',
                thumbnail: 'https://youtu.be/JfYui0H1gRk?si=x0_Zb-WL_35lHkuh',
                videoId: 'https://youtu.be/JfYui0H1gRk?si=x0_Zb-WL_35lHkuh'
            },
            {
                id: 'vid3',
                title: 'Toyota Fortuner 2023',
                thumbnail: 'https://placehold.co/600x400/FF0000/FFFFFF?text=Toyota+Fortuner',
                videoId: 'dummy3'
            },
            {
                id: 'vid4',
                title: 'Royal Enfield Classic 350 Review',
                thumbnail: 'https://placehold.co/600x400/FF0000/FFFFFF?text=Royal+Enfield',
                videoId: 'dummy4'
            },
            {
                id: 'vid5',
                title: 'Hyundai Creta 2023 Walkthrough',
                thumbnail: 'https://placehold.co/600x400/FF0000/FFFFFF?text=Hyundai+Creta',
                videoId: 'dummy5'
            },
            {
                id: 'vid6',
                title: 'KTM Duke 390 Test Ride',
                thumbnail: 'https://placehold.co/600x400/FF0000/FFFFFF?text=KTM+Duke',
                videoId: 'dummy6'
            }
        ];
        return videos;
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}

function renderVideoGallery() {
    const gallery = document.getElementById('video-gallery-grid');
    if (!gallery) return;

    fetchYouTubeVideos().then(videos => {
        gallery.innerHTML = videos.map(video => `
            <div class="youtube-card" onclick="window.open('https://youtube.com/watch?v=${video.videoId}', '_blank')">
                <div class="youtube-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="vehicle-info">
                    <h3>${video.title}</h3>
                </div>
            </div>
        `).join('');
    });
}

document.addEventListener('DOMContentLoaded', renderVideoGallery);