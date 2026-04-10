/*!
 * @name joox-music
 * @description JOOX Music via GD Studio API
 * @version v2.0.0
 * @author custom
 * @key csp_joox
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const API = 'https://music-api-hk.gdstudio.xyz/api.php'
const SOURCE = 'joox'

// ── crc32 簽名（GD Studio 必須）──────────────────
function crc32(id) {
  if (!id) return ''
  const hostname = 'music.gdstudio.xyz'
  const version = '010000'
  const timeStr = Date.now().toString().slice(0, 9)
  const signStr = hostname + '|' + version + '|' + timeStr + '|' + id
  return md5(signStr).slice(-8).toUpperCase()
}

function urlEncode(str) {
  return encodeURIComponent(str).replace(/%20/g, '+')
}

// ── App 配置 ──────────────────────────────────────
const appConfig = {
  ver: 1,
  name: 'JOOX',
  message: 'Powered by GD Studio API',
  desc: 'JOOX Music',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '🔥 熱門歌曲', type: 'song', ui: 0, showMore: true, ext: { gid: 'hot', keyword: 'top hits' } },
      { name: '💿 新歌推薦', type: 'song', ui: 0, showMore: true, ext: { gid: 'new', keyword: 'new music' } },
      { name: '🇭🇰 粵語流行', type: 'song', ui: 0, showMore: true, ext: { gid: 'canto', keyword: '粵語流行' } },
      { name: '🇬🇧 西洋流行', type: 'song', ui: 0, showMore: true, ext: { gid: 'western', keyword: 'pop hits' } },
    ]
  },
  tabMe: {
    name: '我的',
    groups: [
      { name: '紅心', type: 'song' },
      { name: '歌單', type: 'playlist' },
      { name: '專輯', type: 'album' },
      { name: '創作者', type: 'artist' },
    ]
  },
  tabSearch: {
    name: '搜索',
    groups: [
      { name: '歌曲', type: 'song', ext: { type: 'song' } },
    ]
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

// ── 獲取封面 ──────────────────────────────────────
async function getCover(pic_id) {
  if (!pic_id) return ''
  try {
    const sig = crc32(urlEncode(pic_id))
    const { data } = await $fetch.get(
      `${API}?types=pic&source=${SOURCE}&id=${pic_id}&size=300&s=${sig}`,
      { headers }
    )
    const result = typeof data === 'string' ? JSON.parse(data) : data
    return result?.url ?? ''
  } catch (e) { return '' }
}

// ── 搜索歌曲 ──────────────────────────────────────
async function searchJoox(keyword, page = 1, count = 20) {
  try {
    const sig = crc32(keyword)
    const url = `${API}?types=search&source=${SOURCE}&name=${encodeURIComponent(keyword)}&count=${count}&pages=${page}&s=${sig}`
    const { data } = await $fetch.get(url, { headers })
    const result = typeof data === 'string' ? JSON.parse(data) : data
    if (!Array.isArray(result)) return []

    // 並行拉封面
    const songs = await Promise.all(result.slice(0, count).map(async (each) => {
      try {
        const artistName = Array.isArray(each.artist)
          ? each.artist.map(a => typeof a === 'string' ? a : a.name).join(' / ')
          : (each.artist ?? '')
        const songId = `${each.id ?? ''}`
        const coverUrl = await getCover(each.pic_id)
        return {
          id: songId,
          name: each.name ?? '',
          cover: coverUrl,
          duration: each.duration ?? 0,
          artist: {
            id: songId,
            name: artistName,
            cover: '',
          },
          ext: {
            track_id: songId,
            source: SOURCE,
            pic_id: `${each.pic_id ?? ''}`,
            lyric_id: `${each.lyric_id ?? each.id ?? ''}`,
          }
        }
      } catch (e) { return null }
    }))

    return songs.filter(Boolean)
  } catch (e) { return [] }
}

async function getSongs(ext) {
  try {
    const { page = 1, keyword = 'top hits' } = argsify(ext)
    if (page > 3) return jsonify({ list: [] })
    const songs = await searchJoox(keyword, page)
    return jsonify({ list: songs })
  } catch (e) { return jsonify({ list: [] }) }
}

async function getPlaylists(ext) {
  return jsonify({ list: [] })
}

async function getAlbums(ext) {
  return jsonify({ list: [] })
}

async function getArtists(ext) {
  return jsonify({ list: [] })
}

async function search(ext) {
  try {
    const { text, page = 1, type } = argsify(ext)
    if (!text || page > 3) return jsonify({ list: [] })
    if (type === 'song') {
      const songs = await searchJoox(text, page)
      return jsonify({ list: songs })
    }
    return jsonify({ list: [] })
  } catch (e) { return jsonify({ list: [] }) }
}

async function getSongInfo(ext) {
  try {
    const { track_id, pic_id, lyric_id } = argsify(ext)
    if (!track_id) return jsonify({ urls: [] })

    // 音頻 URL
    const sig = crc32(urlEncode(track_id))
    const { data: urlData } = await $fetch.get(
      `${API}?types=url&source=${SOURCE}&id=${track_id}&br=320&s=${sig}`,
      { headers }
    )
    const urlResult = typeof urlData === 'string' ? JSON.parse(urlData) : urlData
    const playUrl = urlResult?.url ?? ''

    // 封面
    const coverUrl = await getCover(pic_id)

    // 歌詞
    let lyric = ''
    if (lyric_id) {
      try {
        const lsig = crc32(urlEncode(lyric_id))
        const { data: lyricData } = await $fetch.get(
          `${API}?types=lyric&source=${SOURCE}&id=${lyric_id}&s=${lsig}`,
          { headers }
        )
        const lyricResult = typeof lyricData === 'string' ? JSON.parse(lyricData) : lyricData
        lyric = lyricResult?.lyric ?? ''
      } catch (e) {}
    }

    return jsonify({
      urls: playUrl ? [playUrl] : [],
      cover: coverUrl,
      lyric: lyric,
    })
  } catch (e) { return jsonify({ urls: [] }) }
}
