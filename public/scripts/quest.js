// Discovery Quest Page JavaScript

const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
let userProgress = { badges: [], quests: [], checkIns: [] };

// ── Translation helper 
function tQuest(key) {
    if (typeof PARAMPARA_TRANSLATIONS === 'undefined') return key;
    const lang = localStorage.getItem('parampara_lang')
              || localStorage.getItem('language')
              || 'en';
    const dict = PARAMPARA_TRANSLATIONS[lang] || PARAMPARA_TRANSLATIONS['en'];
    return (dict && dict[key]) || (PARAMPARA_TRANSLATIONS['en'][key]) || key;
}

// ── Quest data — keys only, translations live in translations.js 
const availableQuests = [
    {
        id: 'quest-1',
        titleKey:       'quest1_title',
        descKey:        'quest1_desc',
        objectives: [
            { id: 'obj-1', textKey: 'quest1_obj1' },
            { id: 'obj-2', textKey: 'quest1_obj2' },
            { id: 'obj-3', textKey: 'quest1_obj3' }
        ],
        reward: {
            type:        'badge',
            nameKey:     'quest1_reward_name',
            descKey:     'quest1_reward_desc',
            icon:        '🌊'
        }
    },
    {
        id: 'quest-2',
        titleKey:       'quest2_title',
        descKey:        'quest2_desc',
        objectives: [
            { id: 'obj-4', textKey: 'quest2_obj1' },
            { id: 'obj-5', textKey: 'quest2_obj2' },
            { id: 'obj-6', textKey: 'quest2_obj3' }
        ],
        reward: {
            type:        'wallpaper',
            nameKey:     'quest2_reward_name',
            descKey:     'quest2_reward_desc',
            icon:        '🎨'
        }
    }
];

// ── Re-render when language changes 
window.addEventListener('parampara:langchange', () => {
    displayProgress();
    displayQuests();
});

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', userId);
    loadUserProgress();
    displayQuests();
});

async function loadUserProgress() {
    try {
        const response = await fetch(`/api/progress/${userId}`);
        const progress = await response.json();
        if (progress.badges) userProgress = progress;
        displayProgress();
    } catch (error) {
        console.error('Error loading progress:', error);
        displayProgress();
    }
}

function displayProgress() {
    document.getElementById('badge-count').textContent    = userProgress.badges?.length  || 0;
    document.getElementById('quest-completed').textContent = userProgress.quests?.length  || 0;
    document.getElementById('check-ins').textContent      = userProgress.checkIns?.length || 0;
    displayBadges();
}

function displayBadges() {
    const badgesGrid = document.getElementById('badges-grid');

    const allBadges = [
        ...(userProgress.badges || []),
        ...availableQuests
            .map(q => q.reward)
            .filter(r => userProgress.quests?.includes(tQuest(r.nameKey)))
    ];

    if (allBadges.length === 0) {
        badgesGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">
                <p>${tQuest('quest_no_badges')}</p>
            </div>`;
        return;
    }

    badgesGrid.innerHTML = allBadges.map(badge => `
        <div class="badge-card">
            <div class="badge-icon">${badge.icon || '🏆'}</div>
            <h4>${escapeHtml(badge.nameKey ? tQuest(badge.nameKey) : badge.name)}</h4>
            <p>${escapeHtml(badge.descKey  ? tQuest(badge.descKey)  : badge.description)}</p>
        </div>
    `).join('');
}

function displayQuests() {
    const questsList = document.getElementById('quests-list');

    questsList.innerHTML = availableQuests.map(quest => {
        const rewardName  = tQuest(quest.reward.nameKey);
        const completed   = userProgress.quests?.includes(rewardName) || false;

        const completedObjectives = quest.objectives.filter(obj => {
            const progress = userProgress.quests?.find(q => q.id === quest.id);
            return progress?.completedObjectives?.includes(obj.id) || false;
        }).length;

        return `
            <div class="quest-card ${completed ? 'completed' : ''}">
                <h4>${escapeHtml(tQuest(quest.titleKey))} ${completed ? '✓' : ''}</h4>
                <p>${escapeHtml(tQuest(quest.descKey))}</p>

                <div class="quest-objectives">
                    ${quest.objectives.map(obj => {
                        const isCompleted = completed ||
                            (userProgress.quests?.find(q => q.id === quest.id)
                                ?.completedObjectives?.includes(obj.id));
                        return `
                            <div class="objective-item ${isCompleted ? 'completed' : ''}">
                                <div class="objective-checkbox ${isCompleted ? 'completed' : ''}">
                                    ${isCompleted ? '✓' : ''}
                                </div>
                                <span>${escapeHtml(tQuest(obj.textKey))}</span>
                            </div>`;
                    }).join('')}
                </div>

                <div class="quest-reward">
                    <h5>${tQuest('quest_reward_label')}: ${quest.reward.icon} ${escapeHtml(rewardName)}</h5>
                    <p>${escapeHtml(tQuest(quest.reward.descKey))}</p>
                    ${completed && quest.reward.type === 'wallpaper' ? `
                        <button class="btn btn-primary"
                            onclick="downloadWallpaper('${quest.id}')"
                            style="margin-top:1rem;">
                            ${tQuest('quest_download_wallpaper')}
                        </button>` : ''}
                </div>

                ${!completed ? `
                    <button class="btn btn-primary"
                        onclick="startQuest('${quest.id}')"
                        style="margin-top:1rem;">
                        ${tQuest('quest_start_btn')}
                    </button>` : ''}
            </div>`;
    }).join('');
}

function startQuest(questId) {
    const quest = availableQuests.find(q => q.id === questId);
    if (!quest) return;

    alert(`${tQuest('quest_starting')}: ${tQuest(quest.titleKey)}\n\n${tQuest('quest_start_hint')}`);

    if (!userProgress.quests) userProgress.quests = [];
    const questProgress = userProgress.quests.find(q => q.id === questId);
    if (!questProgress) {
        userProgress.quests.push({ id: questId, started: true, completedObjectives: [] });
        saveProgress();
    }
}

function completeObjective(questId, objectiveId) {
    if (!userProgress.quests) userProgress.quests = [];

    let questProgress = userProgress.quests.find(q => q.id === questId);
    if (!questProgress) {
        questProgress = { id: questId, completedObjectives: [] };
        userProgress.quests.push(questProgress);
    }

    if (!questProgress.completedObjectives.includes(objectiveId)) {
        questProgress.completedObjectives.push(objectiveId);

        const quest = availableQuests.find(q => q.id === questId);
        if (quest && questProgress.completedObjectives.length === quest.objectives.length) {
            if (!userProgress.badges) userProgress.badges = [];
            userProgress.badges.push({
                icon:    quest.reward.icon,
                nameKey: quest.reward.nameKey,
                descKey: quest.reward.descKey
            });
            userProgress.quests = userProgress.quests.filter(q => q.id !== questId);
            userProgress.quests.push({
                id: questId, completed: true, reward: tQuest(quest.reward.nameKey)
            });
            alert(`${tQuest('quest_completed_msg')}: ${tQuest(quest.reward.nameKey)}`);
        }

        saveProgress();
        displayProgress();
        displayQuests();
    }
}

async function saveProgress() {
    try {
        await fetch(`/api/progress/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProgress)
        });
    } catch (error) {
        console.error('Error saving progress:', error);
    }
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}

function downloadWallpaper(questId) {
    alert(tQuest('quest_wallpaper_msg'));
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.startQuest        = startQuest;
window.completeObjective = completeObjective;
window.downloadWallpaper = downloadWallpaper;
