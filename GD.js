/*!
 * @name joox-gdstudio
 * @description JOOX Music via GD Studio API
 * @version v1.1.0
 * @author custom
 * @key csp_gdjoox
 */

const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }
const GD_API = 'https://music-api.gdstudio.xyz/api.php'
const SOURCE = 'joox'

const appConfig = {
  ver: 1,
  name: 'JOOX',
  message: 'Powered by GD Studio API',
  desc: 'JOOX Music',
  tabLibrary: {
    name: '探索',
    groups: [
      { name: '🔥 熱門歌曲', type: 'song', ui: 0, showMore: true, ext: { gid: '1' } },
      { name: '💿 新歌推薦', type: 'song', ui: 0, showMore: true, ext: { gid: '2' } },
      { name: '🇭🇰 粵語流行', type: 'song', ui: 0, showMore: true, ext: { gid: '3' } },
      { name: '🇬🇧 西洋流行', type: 'song', ui: 0, showMore: true, ext: { gid: '4' } },
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
      { name: '歌單', type: 'playlist', ext: { type: 'playlist' } },
    ]
  }
}

async function getConfig() {
  return jsonify(appConfig)
}

// ✅ 唯一改動：cover 直接拼接 URL，唔需要額外請求
function buildSongItem(each) {
  try {
    const artistName = Array.isArray(each.artist)
      ? each.artist.map(a => typeof a === 'string' ? a : (a.name ?? '')).join(' / ')
      : (each.artist ?? '')
    const songId = `${each.id ?? each.track_id ?? ''}`
    const songName = each.name ?? ''
    const picId = each.pic_id ?? ''
    const coverUrl = picId
      ? `${GD_API}?types=pic&source=${SOURCE}&id=${picId}&size=300`
      : ''

    return {
      id: songId,
      name: songName,
      cover: coverUrl,
      duration: each.duration ?? 0,
      artist: {
        id: `${each.artist?.[0]?.id ?? ''}`,
        name: artistName,
        cover: '',
      },
      ext: {
        source: SOURCE,
        songmid: songId,
        pic_id: picId,
        lyric_id: `${each.lyric_id ?? ''}`,
        singer: artistName,
        songName: songName,
      }
    }
  } catch (e) { return null }
}

async function getSongs(ext) {
  try {
    const { page, gid } = argsify(ext)
    if (page > 1) return jsonify({ list: [] })

    const keywords = {
      '1': 'top hits',
      '2': 'new music',
      '3': '粵語流行',
      '4': 'pop hits',
    }

    const keyword = keywords[gid]
    if (!keyword) return jsonify({ list: [] })

    const url = `${GD_API}?types=search&source=${SOURCE}&name=${encodeURIComponent(keyword)}&count=20&pages=1`
    const { data } = await $fetch.get(url, { headers })
    const list = argsify(data)
    if (!Array.isArray(list)) return jsonify({ list: [] })
    return jsonify({ list: list.map(buildSongItem).filter(Boolean) })

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
    const { text, page, type } = argsify(ext)
    if (!text || page > 3) return jsonify({ list: [] })

    if (type === 'song') {
      const url = `${GD_API}?types=search&source=${SOURCE}&name=${encodeURIComponent(text)}&count=20&pages=${page}`
      const { data } = await $fetch.get(url, { headers })
      const list = argsify(data)
      if (!Array.isArray(list)) return jsonify({ list: [] })
      return jsonify({ list: list.map(buildSongItem).filter(Boolean) })
    }

    if (type === 'playlist') {
      const url = `${GD_API}?types=search&source=${SOURCE}_album&name=${encodeURIComponent(text)}&count=20&pages=${page}`
      const { data } = await $fetch.get(url, { headers })
      const list = argsify(data)
      if (!Array.isArray(list)) return jsonify({ list: [] })
      return jsonify({
        list: list.map((each) => {
          try {
            const picId = each.pic_id ?? ''
            return {
              id: `${each.id ?? ''}`,
              name: each.name ?? '',
              cover: picId ? `${GD_API}?types=pic&source=${SOURCE}&id=${picId}&size=300` : '',
              artist: {
                id: `${each.artist?.[0]?.id ?? ''}`,
                name: (each.artist ?? []).map(a => typeof a === 'string' ? a : (a.name ?? '')).join(' / '),
              },
              ext: {
                gid: 'album',
                id: `${each.id ?? ''}`,
                type: 'album',
              }
            }
          } catch (e) { return null }
        }).filter(Boolean)
      })
    }

    return jsonify({ list: [] })
  } catch (e) { return jsonify({ list: [] }) }
}

async function getSongInfo(ext) {
  try {
    const { songmid, pic_id, lyric_id } = argsify(ext)
    if (!songmid) return jsonify({ urls: [] })

    // 音頻 URL
    const { data: urlData } = await $fetch.get(
      `${GD_API}?types=url&source=${SOURCE}&id=${songmid}&br=320`,
      { headers }
    )
    const soundUrl = argsify(urlData)?.url ?? ''

    // 封面
    let coverUrl = ''
    if (pic_id) {
      try {
        const { data: picData } = await $fetch.get(
          `${GD_API}?types=pic&source=${SOURCE}&id=${pic_id}&size=500`,
          { headers }
        )
        coverUrl = argsify(picData)?.url ?? ''
      } catch (e) {}
    }

    // 歌詞
    let lyric = ''
    if (lyric_id) {
      try {
        const { data: lyricData } = await $fetch.get(
          `${GD_API}?types=lyric&source=${SOURCE}&id=${lyric_id}`,
          { headers }
        )
        lyric = argsify(lyricData)?.lyric ?? ''
      } catch (e) {}
    }

    return jsonify({
      urls: soundUrl ? [soundUrl] : [],
      cover: coverUrl,
      lyric: lyric,
    })
  } catch (e) { return jsonify({ urls: [] }) }
}
