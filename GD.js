/*!
 * @name joox-gdstudio
 * @description JOOX Music via GD Studio API
 * @version v1.0.0
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

function buildSongItem(each) {
  try {
    const artistName = (each.artist ?? []).map(a => a.name).join('/') || ''
    const songId = `${each.id ?? each.track_id ?? ''}`
    const songName = each.name ?? ''
    return {
      id: songId,
      name: songName,
      cover: '',
      duration: 0,
      artist: {
        id: `${each.artist?.[0]?.id ?? ''}`,
        name: artistName,
        cover: '',
      },
      ext: {
        source: SOURCE,
        songmid: songId,
        pic_id: `${each.pic_id ?? ''}`,
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

    // 熱門歌曲
    if (gid == '1') {
      const url = `${GD_API}?types=search&source=${SOURCE}&name=top&count=20&pages=1`
      const { data } = await $fetch.get(url, { headers })
      const list = argsify(data)
      if (!Array.isArray(list)) return jsonify({ list: [] })
      return jsonify({ list: list.map(buildSongItem).filter(Boolean) })
    }

    // 新歌推薦
    if (gid == '2') {
      const url = `${GD_API}?types=search&source=${SOURCE}&name=new&count=20&pages=1`
      const { data } = await $fetch.get(url, { headers })
      const list = argsify(data)
      if (!Array.isArray(list)) return jsonify({ list: [] })
      return jsonify({ list: list.map(buildSongItem).filter(Boolean) })
    }

    return jsonify({ list: [] })
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
      // 用專輯搜索代替歌單
      const url = `${GD_API}?types=search&source=${SOURCE}_album&name=${encodeURIComponent(text)}&count=20&pages=${page}`
      const { data } = await $fetch.get(url, { headers })
      const list = argsify(data)
      if (!Array.isArray(list)) return jsonify({ list: [] })
      return jsonify({
        list: list.map((each) => {
          try {
            return {
              id: `${each.id ?? ''}`,
              name: each.name ?? '',
              cover: '',
              artist: {
                id: `${each.artist?.[0]?.id ?? ''}`,
                name: (each.artist ?? []).map(a => a.name).join('/'),
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
    const { source, songmid, pic_id, lyric_id, songName, singer } = argsify(ext)
    if (!songmid) return jsonify({ urls: [] })

    // 獲取音頻 URL
    const urlApi = `${GD_API}?types=url&source=${SOURCE}&id=${songmid}&br=320`
    const { data: urlData } = await $fetch.get(urlApi, { headers })
    const soundUrl = argsify(urlData)?.url ?? ''

    // 獲取封面
    let coverUrl = ''
    if (pic_id) {
      try {
        const picApi = `${GD_API}?types=pic&source=${SOURCE}&id=${pic_id}&size=500`
        const { data: picData } = await $fetch.get(picApi, { headers })
        coverUrl = argsify(picData)?.url ?? ''
      } catch (e) {}
    }

    // 獲取歌詞
    let lyric = ''
    if (lyric_id) {
      try {
        const lyricApi = `${GD_API}?types=lyric&source=${SOURCE}&id=${lyric_id}`
        const { data: lyricData } = await $fetch.get(lyricApi, { headers })
        const lyricInfo = argsify(lyricData)
        lyric = lyricInfo?.lyric ?? ''
      } catch (e) {}
    }

    return jsonify({
      urls: soundUrl ? [soundUrl] : [],
      cover: coverUrl,
      lyric: lyric,
    })
  } catch (e) { return jsonify({ urls: [] }) }
}
