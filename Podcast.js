/*!
 * @name podcast-itunes
 * @description iTunes Podcast Plugin
 * @version v6.4.0
 * @author custom
 * @key csp_podcast
 */

const $config = argsify($config_str)
const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const ITUNES_API = 'https://itunes.apple.com'

const FEATURED_FEEDS = [
  // 地區熱門
  { id: 'hk_top', name: '🇭🇰 香港熱門', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/json' },
  { id: 'tw_top', name: '🇹🇼 台灣熱門', rss: 'https://itunes.apple.com/tw/rss/toppodcasts/limit=20/json' },
  { id: 'uk_top', name: '🇬🇧 UK Top', rss: 'https://itunes.apple.com/gb/rss/toppodcasts/limit=20/json' },
  { id: 'us_top', name: '🇺🇸 美國熱門', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/json' },
  // 香港分類
  { id: 'hk_news', name: '📰 香港 新聞時事', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1489/json' },
  { id: 'hk_edu', name: '📚 香港 教育', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1304/json' },
  { id: 'hk_biz', name: '💼 香港 商業財經', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1321/json' },
  { id: 'hk_health', name: '🏃 香港 健康', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1512/json' },
  { id: 'hk_arts', name: '🎭 香港 藝術', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1301/json' },
  { id: 'hk_science', name: '🔬 香港 科學', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1533/json' },
  { id: 'hk_comedy', name: '😂 香港 喜劇', rss: 'https://itunes.apple.com/hk/rss/toppodcasts/limit=20/genre=1303/json' },
  // 英國分類
  { id: 'uk_news', name: '📰 UK 新聞時事', rss: 'https://itunes.apple.com/gb/rss/toppodcasts/limit=20/genre=1489/json' },
  { id: 'uk_biz', name: '💼 UK 商業財經', rss: 'https://itunes.apple.com/gb/rss/toppodcasts/limit=20/genre=1321/json' },
  { id: 'uk_science', name: '🔬 UK 科學', rss: 'https://itunes.apple.com/gb/rss/toppodcasts/limit=20/genre=1533/json' },
  { id: 'uk_arts', name: '🎭 UK 藝術', rss: 'https://itunes.apple.com/gb/rss/toppodcasts/limit=20/genre=1301/json' },
  // 美國分類
  { id: 'us_news', name: '📰 美國 新聞時事', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/genre=1489/json' },
  { id: 'us_tech', name: '💻 美國 科技', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/genre=1318/json' },
  { id: 'us_crime', name: '🔍 美國 True Crime', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/genre=1488/json' },
  { id: 'us_comedy', name: '😂 美國 Comedy', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/genre=1303/json' },
  { id: 'us_sports', name: '🏈 美國 體育', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/genre=1545/json' },
  { id: 'us_society', name: '🎙️ 美國 Society & Culture', rss: 'https://itunes.apple.com/us/rss/toppodcasts/limit=20/genre=1324/json' },
]

const appConfig = {
  ver: 1,
  name: 'Podcast',
  message: '',
  desc: '廣東話 & English Podcasts',
  tabLibrary: {
    name: '探索',
    groups: [
      // 地區熱門
      { name: '🇭🇰 香港熱門', type: 'playlist', ui: 1, showMore: true, ext: { gid: 'hk_top' } },
      { name: '🇹🇼 台灣熱門', type: 'playlist', ui: 1, showMore: true, ext: { gid: 'tw_top' } },
      { name: '🇬🇧 UK Top', type: 'playlist', ui: 1, showMore: true, ext: { gid: 'uk_top' } },
      { name: '🇺🇸 美國熱門', type: 'playlist', ui: 1, showMore: true, ext: { gid: 'us_top' } },
      // 香港分類
      { name: '📰 香港 新聞時事', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_news' } },
      { name: '📚 香港 教育', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_edu' } },
      { name: '💼 香港 商業財經', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_biz' } },
      { name: '🏃 香港 健康', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_health' } },
      { name: '🎭 香港 藝術', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_arts' } },
      { name: '🔬 香港 科學', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_science' } },
      { name: '😂 香港 喜劇', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'hk_comedy' } },
      // 英國分類
      { name: '📰 UK 新聞時事', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'uk_news' } },
      { name: '💼 UK 商業財經', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'uk_biz' } },
      { name: '🔬 UK 科學', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'uk_science' } },
      { name: '🎭 UK 藝術', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'uk_arts' } },
      // 美國分類
      { name: '📰 美國 新聞時事', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'us_news' } },
      { name: '💻 美國 科技', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'us_tech' } },
      { name: '🔍 美國 True Crime', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'us_crime' } },
      { name: '😂 美國 Comedy', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'us_comedy' } },
      { name: '🏈 美國 體育', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'us_sports' } },
      { name: '🎙️ 美國 Society & Culture', type: 'playlist', ui: 1, showMore: false, ext: { gid: 'us_society' } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '收藏節目', type: 'playlist' },
      { name: '收藏單集', type: 'song' },
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '節目', type: 'playlist', ext: { type: 'playlist' } },
      { name: '單集', type: 'song', ext: { type: 'song' } },
    ]
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

function parseDuration(str) {
  try {
    if (!str) return 0
    if (/^\d+$/.test(str)) return parseInt(str)
    const parts = str.split(':').map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return 0
  } catch (e) { return 0 }
}

async function loadRssEpisodes(feedUrl) {
  try {
    const { data } = await $fetch.get(feedUrl, { headers })
    const $ = cheerio.load(data, { xmlMode: true })
    const podcastName = $('channel > title').first().text() || ''
    const podcastCover = $('channel > image > url').first().text()
      || $('itunes\\:image').first().attr('href') || ''

    const episodes = []
    $('item').each((i, el) => {
      try {
        const ele = $(el)
        const audioUrl = ele.find('enclosure').attr('url') ?? ''
        if (!audioUrl) return
        episodes.push({
          id: ele.find('guid').text() || audioUrl,
          name: ele.find('title').text() || '',
          cover: ele.find('itunes\\:image').attr('href') ?? podcastCover,
          duration: parseDuration(ele.find('itunes\\:duration').text()),
          artist: { id: podcastName, name: podcastName, cover: podcastCover },
          ext: {
            pid: audioUrl,
            description: (ele.find('description').text() || '').slice(0, 300),
            pubDate: ele.find('pubDate').text() || '',
          }
        })
      } catch (e) {}
    })
    return episodes
  } catch (e) { return [] }
}

async function loadItunesTopPodcasts(rssUrl) {
  try {
    const { data } = await $fetch.get(rssUrl, { headers })
    const entries = argsify(data)?.feed?.entry ?? []
    return entries.map((each) => {
      try {
        const id = each?.id?.attributes?.['im:id'] ?? ''
        const cover = (each?.['im:image'] ?? []).slice(-1)[0]?.label ?? ''
        return {
          id,
          name: each?.['im:name']?.label ?? '',
          cover,
          artist: { id, name: each?.['im:artist']?.label ?? '' },
          ext: { gid: 'podcast', id, type: 'podcast' }
        }
      } catch (e) { return null }
    }).filter(Boolean)
  } catch (e) { return [] }
}

async function getPlaylists(ext) {
  try {
    const { page, gid } = argsify(ext)
    if (page > 1) return jsonify({ list: [] })
    const feed = FEATURED_FEEDS.find(f => f.id === gid)
    if (!feed) return jsonify({ list: [] })
    const cards = await loadItunesTopPodcasts(feed.rss)
    return jsonify({ list: cards })
  } catch (e) { return jsonify({ list: [] }) }
}

async function getSongs(ext) {
  try {
    const { page, id, feedUrl } = argsify(ext)
    if (page > 1 || !id) return jsonify({ list: [] })

    let rssUrl = feedUrl ?? ''
    if (!rssUrl) {
      try {
        const { data } = await $fetch.get(
          `${ITUNES_API}/lookup?id=${id}&entity=podcast`,
          { headers }
        )
        rssUrl = argsify(data)?.results?.[0]?.feedUrl ?? ''
      } catch (e) { rssUrl = '' }
    }

    if (!rssUrl) return jsonify({ list: [] })
    const episodes = await loadRssEpisodes(rssUrl)
    return jsonify({ list: episodes })
  } catch (e) { return jsonify({ list: [] }) }
}

async function getSongInfo(ext) {
  try {
    const { pid, description, pubDate } = argsify(ext)
    if (!pid) return jsonify({ urls: [] })
    return jsonify({
      urls: [pid],
      lyric: [pubDate ? `📅 ${pubDate}` : '', '', description ?? ''].filter(Boolean).join('\n'),
    })
  } catch (e) { return jsonify({ urls: [] }) }
}

async function search(ext) {
  try {
    const { text, page, type } = argsify(ext)
    if (!text || page > 3) return jsonify({ list: [] })

    if (type === 'playlist') {
      const url = `${ITUNES_API}/search?term=${encodeURIComponent(text)}&media=podcast&entity=podcast&limit=20&offset=${(page - 1) * 20}`
      const { data } = await $fetch.get(url, { headers })
      const results = argsify(data)?.results ?? []
      return jsonify({
        list: results.map((each) => ({
          id: `${each.collectionId}`,
          name: each.collectionName ?? '',
          cover: each.artworkUrl600 ?? '',
          artist: { id: `${each.artistId ?? ''}`, name: each.artistName ?? '' },
          ext: { gid: 'podcast', id: `${each.collectionId}`, feedUrl: each.feedUrl ?? '' }
        }))
      })
    }

    if (type === 'song') {
      const url = `${ITUNES_API}/search?term=${encodeURIComponent(text)}&media=podcast&entity=podcastEpisode&limit=20&offset=${(page - 1) * 20}`
      const { data } = await $fetch.get(url, { headers })
      const results = argsify(data)?.results ?? []
      return jsonify({
        list: results.map((each) => ({
          id: `${each.trackId}`,
          name: each.trackName ?? '',
          cover: each.artworkUrl600 ?? '',
          duration: each.trackTimeMillis ? Math.floor(each.trackTimeMillis / 1000) : 0,
          artist: { id: `${each.collectionId ?? ''}`, name: each.collectionName ?? '', cover: '' },
          ext: {
            pid: each.episodeUrl ?? '',
            description: (each.description ?? '').slice(0, 300),
            pubDate: each.releaseDate ?? '',
          }
        }))
      })
    }

    return jsonify({ list: [] })
  } catch (e) { return jsonify({ list: [] }) }
}

async function getAlbums(ext) { return jsonify({ list: [] }) }
async function getArtists(ext) { return jsonify({ list: [] }) }
