window.__ModuleLoader__.load({
  id: '@nibuil/dsh-voice-modes',
  factory(require) {
    const React = require('react')
    const { useEffect, useRef, useState } = React
    const h = React.createElement

    const NS = 'voice-modes'
    const API = '/voice-modes'
    const STORAGE_MODE = 'dsh.voice-modes.mode'
    const STORAGE_ROLE = 'dsh.voice-modes.role'
    const MAX_RECORDING_SECONDS = 120
    const WAVE_BARS = 28

    const FALLBACK_ROLES = [
      {
        id: 'meeting-notes',
        name: '会议纪要',
        prompt:
          '你是一名专业的会议秘书。把口述内容整理成结构清晰的会议纪要，区分议题、结论和待办事项；只保留明确出现的信息，不要编造。',
      },
      {
        id: 'tech-writing',
        name: '技术说明',
        prompt:
          '你是一名资深软件工程师。把口述内容整理为准确、简洁的技术说明，使用恰当的术语和清晰的分段，不要添加未提及的事实。',
      },
      {
        id: 'business-email',
        name: '商务邮件',
        prompt:
          '你是一名商务沟通专家。把口述内容整理成一封礼貌、清晰、简洁的商务邮件，保留原意和语气，不要添加承诺或事实。',
      },
      {
        id: 'product-request',
        name: '产品需求',
        prompt:
          '你是一名产品经理。把口述内容整理成产品需求描述，按背景、目标、需求细节和验收标准组织；不清楚的地方明确标为待确认，不要编造。',
      },
    ]

    const ZH = {
      micStart: '开始语音输入',
      micStop: '停止录音',
      micProcessing: '识别与处理中',
      micUnsupported: '当前浏览器不支持录音。',
      micPermission: '无法访问麦克风，请检查浏览器权限。',
      recording: '录音中',
      recordingNow: '正在录音',
      processingShort: '正在识别…',
      cancelRecording: '取消录音',
      recordingLimit: '录音时长已达上限，已自动停止。',
      modeButton: '语音模式',
      modeMenuTitle: '选择语音模式',
      modeDirect: '直出',
      modeOptimize: '优化',
      modeTranslate: '翻译',
      modeRole: '自定义角色',
      modeDirectDesc: '识别后原样插入输入框',
      modeOptimizeDesc: '去掉语气词和停顿，保留原意',
      modeTranslateDesc: '整理后翻译成英语',
      modeRoleDesc: '按所选角色的提示词整理',
      customRoles: '自定义角色',
      noRoles: '还没有角色，请到设置中新增。',
      settings: '语音设置',
      settingsTitle: '语音输入设置',
      settingsSubtitle: '密钥只保存在本机 Host，浏览器不会读取已保存的密钥。',
      asrSection: 'ASR 供应商',
      asrUrl: '接口地址',
      asrUrlPlaceholder: 'https://api.openai.com/v1 或完整 /audio/transcriptions 地址',
      asrUrlHint: '可填 /v1 基础地址或完整的 /audio/transcriptions 地址。',
      asrKey: 'API Key',
      asrKeyRequired: '必填',
      asrKeySaved: '已保存密钥，留空保持不变',
      asrKeyMissing: '尚未保存密钥',
      asrModel: '识别模型',
      providerDetected: '已保存的适配器',
      providerCatalogHint: '内置适配器（保存后按 URL 自动匹配）：',
      providerMimoHint: '小米 MiMo 仅接受 wav/mp3；插件会自动把录音转成 16 kHz 单声道 WAV。',
      'provider.xiaomi-mimo': '小米 MiMo ASR',
      'provider.openai-transcription': 'OpenAI 兼容转写',
      errorAudioFormat: '当前 ASR 供应商不接受该音频格式，请重试。',
      secondSection: '第二供应商（可选）',
      secondHint: '用于优化、翻译和自定义角色的文本处理，也会作为 ASR 的备用线路。',
      secondUrl: '接口地址',
      secondUrlPlaceholder: 'https://api.openai.com/v1 或完整 /chat/completions 地址',
      secondKey: 'API Key',
      secondModel: '文本模型',
      targetSection: '翻译',
      targetLanguage: '目标语言',
      targetEnglish: '英语（目前仅支持）',
      rolesSection: '可用角色',
      rolesHint: '角色用于「自定义角色」模式，提示词会作为系统指令发送给第二供应商。',
      addRole: '新增角色',
      editRole: '编辑',
      roleDialogNewTitle: '新增角色',
      roleDialogEditTitle: '编辑角色',
      roleDialogHint: '角色名称用于菜单展示，提示词会作为系统指令发送给第二供应商。',
      saveRole: '保存角色',
      roleValidation: '角色名称和提示词都不能为空。',
      roleName: '角色名称',
      rolePrompt: '提示词',
      roleNamePlaceholder: '例如：周报助手',
      rolePromptPlaceholder: '描述这个角色应如何整理口述内容…',
      deleteRole: '删除角色',
      save: '保存',
      saving: '保存中…',
      cancel: '取消',
      saved: '语音设置已保存',
      loading: '加载中…',
      loadFailed: '无法加载语音设置。',
      retry: '重试',
      saveFailed: '保存失败',
      validationAsrUrl: '请填写 ASR 接口地址。',
      validationAsrKey: '请填写 ASR API Key。',
      validationRoles: '请至少保留一个角色。',
      validationRoleFields: '角色的名称和提示词都不能为空。',
      insertFailed: '输入框已变化，识别结果已复制到剪贴板。',
      copied: '识别结果已复制到剪贴板。',
      copyFailed: '无法插入或复制识别结果，请重试。',
      close: '关闭',
      asrReady: 'ASR 已配置',
      asrMissing: 'ASR 未配置',
      fallbackUsed: '主 ASR 失败，已使用第二供应商。',
      errorNotConfigured: '请先在语音设置中配置 ASR 供应商。',
      errorTextNotConfigured: '该模式需要配置第二供应商的地址与 API Key。',
      errorAsr: '语音识别失败',
      errorLlm: '文本处理失败',
      errorNetwork: '无法连接本机语音服务。',
      errorAudio: '没有录到有效音频，请重试。',
      errorUnknown: '发生未知错误。',
      errorTimeout: '上游服务响应超时。',
      errorRole: '选中的角色已不存在，请重新选择。',
    }

    const EN = {
      micStart: 'Start voice input',
      micStop: 'Stop recording',
      micProcessing: 'Transcribing and processing',
      micUnsupported: 'This browser does not support audio recording.',
      micPermission: 'Cannot access the microphone. Check browser permissions.',
      recording: 'Recording',
      recordingNow: 'Recording',
      processingShort: 'Transcribing…',
      cancelRecording: 'Cancel recording',
      recordingLimit: 'Recording reached the limit and stopped automatically.',
      modeButton: 'Voice mode',
      modeMenuTitle: 'Choose a voice mode',
      modeDirect: 'Direct',
      modeOptimize: 'Polish',
      modeTranslate: 'Translate',
      modeRole: 'Custom role',
      modeDirectDesc: 'Insert the transcript as-is',
      modeOptimizeDesc: 'Remove filler words while keeping meaning',
      modeTranslateDesc: 'Polish, then translate into English',
      modeRoleDesc: 'Format with the selected role prompt',
      customRoles: 'Custom roles',
      noRoles: 'No roles yet. Add one in settings.',
      settings: 'Voice settings',
      settingsTitle: 'Voice input settings',
      settingsSubtitle: 'Keys stay on the local Host; the browser never reads saved keys.',
      asrSection: 'ASR provider',
      asrUrl: 'Endpoint',
      asrUrlPlaceholder: 'https://api.openai.com/v1 or a full /audio/transcriptions URL',
      asrUrlHint: 'Use a /v1 base URL or a full /audio/transcriptions endpoint.',
      asrKey: 'API key',
      asrKeyRequired: 'Required',
      asrKeySaved: 'A key is saved; leave blank to keep it',
      asrKeyMissing: 'No key saved',
      asrModel: 'Transcription model',
      providerDetected: 'Saved adapter',
      providerCatalogHint: 'Built-in adapters (matched from the URL when you save):',
      providerMimoHint:
        'Xiaomi MiMo accepts only WAV/MP3. Recordings are converted to 16 kHz mono WAV automatically.',
      'provider.xiaomi-mimo': 'Xiaomi MiMo ASR',
      'provider.openai-transcription': 'OpenAI-compatible transcription',
      errorAudioFormat: 'The current ASR provider does not accept this audio format. Try again.',
      secondSection: 'Second provider (optional)',
      secondHint:
        'Handles text for Polish, Translate and custom roles, and acts as an ASR fallback.',
      secondUrl: 'Endpoint',
      secondUrlPlaceholder: 'https://api.openai.com/v1 or a full /chat/completions URL',
      secondKey: 'API key',
      secondModel: 'Text model',
      targetSection: 'Translation',
      targetLanguage: 'Target language',
      targetEnglish: 'English (the only supported language)',
      rolesSection: 'Available roles',
      rolesHint:
        'Roles power the Custom role mode. The prompt is sent to the second provider as a system instruction.',
      addRole: 'Add role',
      editRole: 'Edit',
      roleDialogNewTitle: 'New role',
      roleDialogEditTitle: 'Edit role',
      roleDialogHint:
        'The name is shown in the mode menu; the prompt is sent to the second provider as a system instruction.',
      saveRole: 'Save role',
      roleValidation: 'Role name and prompt are both required.',
      roleName: 'Role name',
      rolePrompt: 'Prompt',
      roleNamePlaceholder: 'e.g. Weekly report assistant',
      rolePromptPlaceholder: 'Describe how this role should organize the transcript…',
      deleteRole: 'Delete role',
      save: 'Save',
      saving: 'Saving…',
      cancel: 'Cancel',
      saved: 'Voice settings saved',
      loading: 'Loading…',
      loadFailed: 'Could not load voice settings.',
      retry: 'Retry',
      saveFailed: 'Could not save',
      validationAsrUrl: 'Enter the ASR endpoint.',
      validationAsrKey: 'Enter the ASR API key.',
      validationRoles: 'Keep at least one role.',
      validationRoleFields: 'Every role needs a name and a prompt.',
      insertFailed: 'The draft changed, so the result was copied to the clipboard.',
      copied: 'The result was copied to the clipboard.',
      copyFailed: 'Could not insert or copy the result. Try again.',
      close: 'Close',
      asrReady: 'ASR configured',
      asrMissing: 'ASR not configured',
      fallbackUsed: 'Primary ASR failed; the second provider was used.',
      errorNotConfigured: 'Configure the ASR provider in Voice settings first.',
      errorTextNotConfigured: 'This mode needs the second provider URL and API key.',
      errorAsr: 'Speech recognition failed',
      errorLlm: 'Text processing failed',
      errorNetwork: 'Cannot reach the local voice service.',
      errorAudio: 'No usable audio was recorded. Try again.',
      errorUnknown: 'An unknown error occurred.',
      errorTimeout: 'The upstream service timed out.',
      errorRole: 'The selected role no longer exists. Choose another one.',
    }

    function makeDraft(settings) {
      return {
        asrUrl: settings.asrUrl,
        asrApiKey: '',
        asrModel: settings.asrModel,
        secondaryUrl: settings.secondaryUrl,
        secondaryApiKey: '',
        secondaryModel: settings.secondaryModel,
        targetLanguage: 'en',
        roles: settings.roles.map((role) => ({ ...role })),
        hasAsrApiKey: settings.hasAsrApiKey,
        hasSecondaryApiKey: settings.hasSecondaryApiKey,
        asrProvider: settings.asrProvider ?? null,
        asrProviders: settings.asrProviders ?? [],
      }
    }

    function readStoredMode() {
      try {
        const mode = localStorage.getItem(STORAGE_MODE)
        return ['direct', 'optimize', 'translate', 'role'].includes(mode) ? mode : 'direct'
      } catch {
        return 'direct'
      }
    }

    function readStoredRole() {
      try {
        return localStorage.getItem(STORAGE_ROLE) ?? ''
      } catch {
        return ''
      }
    }

    function store(key, value) {
      try {
        localStorage.setItem(key, value)
      } catch {
        // A blocked storage area must not break the composer widget.
      }
    }

    function randomId() {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID()
        }
      } catch {
        // Fall through to the timestamp id.
      }
      return `role-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    }

    function parseJson(response) {
      return response.json().catch(() => null)
    }

    async function callApi(path, init) {
      let response
      try {
        response = await fetch(`${API}${path}`, {
          credentials: 'same-origin',
          ...init,
        })
      } catch {
        throw { code: 'network', detail: '' }
      }
      const data = await parseJson(response)
      if (!response.ok) {
        throw {
          code: data?.error ?? 'internal',
          detail: typeof data?.message === 'string' ? data.message : '',
        }
      }
      return data
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = String(reader.result ?? '')
          resolve(result.slice(result.indexOf(',') + 1))
        }
        reader.onerror = () => reject(reader.error ?? new Error('cannot read recording'))
        reader.readAsDataURL(blob)
      })
    }

    function chooseMimeType() {
      if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return ''
      }
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ]
      return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
    }

    function writeAscii(view, offset, value) {
      for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index))
      }
    }

    function encodePcmWav(samples, sampleRate) {
      const dataSize = samples.length * 2
      const buffer = new ArrayBuffer(44 + dataSize)
      const view = new DataView(buffer)
      writeAscii(view, 0, 'RIFF')
      view.setUint32(4, 36 + dataSize, true)
      writeAscii(view, 8, 'WAVE')
      writeAscii(view, 12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeAscii(view, 36, 'data')
      view.setUint32(40, dataSize, true)
      let offset = 44
      for (let index = 0; index < samples.length; index += 1) {
        const sample = Math.max(-1, Math.min(1, samples[index]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
        offset += 2
      }
      return new Blob([buffer], { type: 'audio/wav' })
    }

    async function convertToWav(blob) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext
      if (!AudioCtx || !OfflineCtx) return null
      let context
      try {
        context = new AudioCtx()
        const sourceBytes = await blob.arrayBuffer()
        const decoded = await new Promise((resolve, reject) => {
          let settled = false
          const succeed = (value) => {
            if (settled) return
            settled = true
            resolve(value)
          }
          const fail = (error) => {
            if (settled) return
            settled = true
            reject(error)
          }
          try {
            const maybe = context.decodeAudioData(sourceBytes.slice(0), succeed, fail)
            if (maybe && typeof maybe.then === 'function') maybe.then(succeed, fail)
          } catch (error) {
            fail(error)
          }
        })
        const rate = 16_000
        const length = Math.max(1, Math.ceil(decoded.duration * rate))
        const offline = new OfflineCtx(1, length, rate)
        const source = offline.createBufferSource()
        source.buffer = decoded
        source.connect(offline.destination)
        source.start(0)
        const rendered = await offline.startRendering()
        return encodePcmWav(rendered.getChannelData(0), rate)
      } catch (error) {
        console.warn('[voice-modes] cannot convert recording to WAV:', error)
        return null
      } finally {
        try {
          await context?.close?.()
        } catch {
          // The context may already be closed.
        }
      }
    }

    function formatError(error, t, notify) {
      const code = error?.code
      const detail = typeof error?.detail === 'string' ? error.detail.trim().slice(0, 320) : ''
      if (code === 'not-configured') return t('errorNotConfigured')
      if (code === 'text-not-configured') return t('errorTextNotConfigured')
      if (code === 'asr-failed' || code === 'asr-empty') {
        return detail ? `${t('errorAsr')}：${detail}` : t('errorAsr')
      }
      if (code === 'llm-failed' || code === 'llm-empty') {
        return detail ? `${t('errorLlm')}：${detail}` : t('errorLlm')
      }
      if (code === 'upstream-timeout') return t('errorTimeout')
      if (code === 'network') return t('errorNetwork')
      if (code === 'unsupported-audio-format') return t('errorAudioFormat')
      if (code === 'asr-request') return detail ? `${t('errorAsr')}：${detail}` : t('errorAsr')
      if (code === 'audio-too-large') {
        return detail ? `${t('errorAudio')} ${detail}` : t('errorAudio')
      }
      if (code === 'empty-audio') return t('errorAudio')
      if (code === 'unknown-role') return t('errorRole')
      if (code === 'missing-asr-url' || code === 'missing-asr-key') return t('validationAsrKey')
      return detail ? `${t('errorUnknown')} ${detail}` : t('errorUnknown')
    }

    function modeLabel(mode, role, t) {
      if (mode === 'optimize') return t('modeOptimize')
      if (mode === 'translate') return t('modeTranslate')
      if (mode === 'role') return role?.name || t('modeRole')
      return t('modeDirect')
    }

    function formatTimer(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}:${String(seconds).padStart(2, '0')}`
    }

    function modeIcon(mode) {
      if (mode === 'optimize') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
          h('path', {
            d: 'M8 2.2 9.1 5.4 12.3 6.5 9.1 7.6 8 10.8 6.9 7.6 3.7 6.5 6.9 5.4 8 2.2Z',
            stroke: 'currentColor',
            'stroke-width': 1.3,
            'stroke-linejoin': 'round',
          }),
          h('path', {
            d: 'M12.6 10.2 13.1 11.7 14.6 12.2 13.1 12.7 12.6 14.2 12.1 12.7 10.6 12.2 12.1 11.7 12.6 10.2Z',
            fill: 'currentColor',
          }),
        )
      }
      if (mode === 'translate') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
          h('circle', { cx: 8, cy: 8, r: 5.7, stroke: 'currentColor', 'stroke-width': 1.4 }),
          h('path', {
            d: 'M2.6 8h10.8M8 2.3c1.5 1.6 2.2 3.5 2.2 5.7S9.5 12.1 8 13.7C6.5 12.1 5.8 10.2 5.8 8S6.5 3.9 8 2.3Z',
            stroke: 'currentColor',
            'stroke-width': 1.1,
          }),
        )
      }
      if (mode === 'role') {
        return h(
          'svg',
          { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
          h('circle', { cx: 8, cy: 5.4, r: 2.5, stroke: 'currentColor', 'stroke-width': 1.4 }),
          h('path', {
            d: 'M3.2 13.2c.4-2.5 2.3-4.1 4.8-4.1s4.4 1.6 4.8 4.1',
            stroke: 'currentColor',
            'stroke-width': 1.4,
            'stroke-linecap': 'round',
          }),
        )
      }
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M3 4.2h10M3 8h6M3 11.8h4M11.8 8.4v4.2m0 0 1.8-1.8m-1.8 1.8L10 10.8',
          stroke: 'currentColor',
          'stroke-width': 1.4,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      )
    }

    function providerName(provider, t) {
      if (!provider) return ''
      const key = `provider.${provider.id}`
      try {
        const localized = t(key)
        if (localized && localized !== key) return localized
      } catch {
        // Fall back to the Host-provided label.
      }
      return provider.label || provider.id
    }

    function micIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 9, y: 3, width: 6, height: 11, rx: 3, fill: 'currentColor' }),
        h('path', {
          d: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7',
          stroke: 'currentColor',
          'stroke-width': 1.8,
          'stroke-linecap': 'round',
        }),
      )
    }

    function stopIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 7, y: 7, width: 10, height: 10, rx: 2, fill: 'currentColor' }),
      )
    }

    function gearIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 12, cy: 12, r: 3.2, stroke: 'currentColor', 'stroke-width': 1.8 }),
        h('path', {
          d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.87 2.87-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21H9.97v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.87-2.87.06-.06A1.7 1.7 0 0 0 4.54 15a1.7 1.7 0 0 0-1.56-1.03H2.9V9.97h.08A1.7 1.7 0 0 0 4.54 8.94a1.7 1.7 0 0 0-.34-1.87l-.06-.06L7.01 4.14l.06.06a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 9.97 2.98V2.9h4.06v.08a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.87 2.87-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.56 1.03h.08v4.06h-.08A1.7 1.7 0 0 0 19.4 15Z',
          stroke: 'currentColor',
          'stroke-width': 1.4,
          'stroke-linejoin': 'round',
        }),
      )
    }

    function checkIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'm3 8.2 3.2 3.2L13 4.8',
          stroke: 'currentColor',
          'stroke-width': 1.8,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      )
    }

    function chevronIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'm4 6 4 4 4-4',
          stroke: 'currentColor',
          'stroke-width': 1.6,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      )
    }

    function closeIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'm4 4 8 8M12 4l-8 8',
          stroke: 'currentColor',
          'stroke-width': 1.6,
          'stroke-linecap': 'round',
        }),
      )
    }

    function plusIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M8 3v10M3 8h10',
          stroke: 'currentColor',
          'stroke-width': 1.8,
          'stroke-linecap': 'round',
        }),
      )
    }

    const STYLE = `
      .vm-root { position: relative; display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
      .vm-mic {
        width: 30px; height: 30px; padding: 0; border-radius: 999px; flex: none;
        display: inline-grid; place-items: center; cursor: pointer;
        border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-secondary);
        transition: background .15s ease, color .15s ease, border-color .15s ease;
      }
      .vm-mic svg { width: 16px; height: 16px; display: block; }
      .vm-mic:hover:not(:disabled) {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-border-l2);
      }
      .vm-mic:focus-visible, .vm-mode-btn:focus-visible, .vm-menu button:focus-visible,
      .vm-icon-btn:focus-visible, .vm-input:focus-visible, .vm-textarea:focus-visible,
      .vm-primary:focus-visible, .vm-secondary:focus-visible, .vm-link-btn:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
      }
      .vm-mic:disabled { cursor: default; opacity: .72; }
      .vm-mic[data-phase="recording"] {
        background: var(--dsw-alias-state-error-primary);
        border-color: transparent;
        color: var(--dsw-alias-bg-base);
        animation: vm-pulse 1.5s ease-in-out infinite;
      }
      .vm-mic[data-phase="processing"] { color: var(--dsw-alias-brand-primary); }
      .vm-spinner {
        width: 14px; height: 14px; border-radius: 999px;
        border: 2px solid color-mix(in srgb, currentColor 25%, transparent);
        border-top-color: currentColor;
        animation: vm-spin .8s linear infinite;
      }
      .vm-seconds {
        font-size: 11px; line-height: 1; font-variant-numeric: tabular-nums;
        color: var(--dsw-alias-state-error-primary); flex: none; min-width: 24px;
      }
      .vm-mode-btn {
        height: 30px; max-width: 154px; padding: 0 9px; border-radius: 999px;
        display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
        border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-secondary);
        font: inherit; font-size: 12px; line-height: 1; white-space: nowrap;
        transition: background .15s ease, color .15s ease, border-color .15s ease;
      }
      .vm-mode-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .vm-mode-btn svg { width: 12px; height: 12px; flex: none; }
      .vm-mode-text { overflow: hidden; text-overflow: ellipsis; }
      .vm-warn-dot {
        width: 6px; height: 6px; border-radius: 999px; flex: none;
        background: var(--dsw-alias-state-warn-primary);
      }
      .vm-menu {
        position: fixed; z-index: 1000; width: 258px; max-height: min(420px, 70vh);
        overflow: auto; padding: 5px; border-radius: 12px;
        background: var(--dsw-alias-bg-overlay);
        border: 1px solid var(--dsw-alias-border-l1);
        box-shadow: 0 10px 30px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
      }
      .vm-menu-heading {
        padding: 7px 9px 4px; font-size: 11px; font-weight: 600;
        color: var(--dsw-alias-label-secondary); letter-spacing: .01em;
      }
      .vm-menu-item {
        width: 100%; border: 0; background: transparent; text-align: left;
        display: flex; align-items: flex-start; gap: 8px; padding: 7px 8px;
        border-radius: 8px; color: var(--dsw-alias-label-primary);
        font: inherit; cursor: pointer;
      }
      .vm-menu-item:hover { background: var(--dsw-alias-bg-layer-2); }
      .vm-menu-item[aria-checked="true"], .vm-menu-item[aria-selected="true"] {
        background: var(--dsw-alias-bg-layer-2);
      }
      .vm-menu-check { width: 14px; height: 14px; flex: none; margin-top: 2px; color: var(--dsw-alias-brand-primary); }
      .vm-menu-check.empty { visibility: hidden; }
      .vm-menu-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .vm-menu-name { font-size: 12.5px; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vm-menu-desc { font-size: 10.5px; line-height: 1.35; color: var(--dsw-alias-label-secondary); }
      .vm-menu-sep { height: 1px; margin: 5px 4px; background: var(--dsw-alias-border-l1); }
      .vm-menu-empty { padding: 6px 9px 8px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .vm-menu-settings {
        width: 100%; border: 0; background: transparent; cursor: pointer;
        display: flex; align-items: center; gap: 8px; padding: 8px;
        border-radius: 8px; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px;
      }
      .vm-menu-settings:hover { background: var(--dsw-alias-bg-layer-2); }
      .vm-menu-settings svg { width: 14px; height: 14px; flex: none; color: var(--dsw-alias-label-secondary); }
      .vm-status {
        margin-left: auto; font-size: 10px; color: var(--dsw-alias-state-warn-primary);
        white-space: nowrap;
      }
      .vm-status.ok { color: var(--dsw-alias-label-secondary); }
      .vm-modal-backdrop {
        position: fixed; inset: 0; z-index: 1100; display: grid; place-items: center;
        padding: 20px; background: color-mix(in srgb, var(--dsw-alias-bg-base) 30%, rgb(0 0 0 / .48));
        backdrop-filter: blur(2px);
      }
      .vm-modal {
        width: min(620px, 100%); max-height: min(760px, calc(100vh - 40px));
        display: flex; flex-direction: column; overflow: hidden;
        border-radius: 16px; border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
        box-shadow: 0 24px 70px color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);
      }
      .vm-modal-head {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 16px 18px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .vm-modal-title { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 600; }
      .vm-modal-sub { margin: 3px 0 0; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
      .vm-icon-btn {
        margin-left: auto; flex: none; width: 28px; height: 28px; padding: 0;
        border: 0; border-radius: 8px; background: transparent; cursor: pointer;
        color: var(--dsw-alias-label-secondary); display: grid; place-items: center;
      }
      .vm-icon-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .vm-icon-btn svg { width: 14px; height: 14px; }
      .vm-modal-body { padding: 14px 18px 18px; overflow: auto; }
      .vm-section { padding: 12px 0 4px; }
      .vm-section + .vm-section { border-top: 1px solid var(--dsw-alias-border-l1); margin-top: 6px; }
      .vm-section-title { margin: 0 0 3px; font-size: 12.5px; font-weight: 600; }
      .vm-section-hint { margin: 0 0 10px; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
      .vm-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
      .vm-label { font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-secondary); display: flex; align-items: center; gap: 5px; }
      .vm-required { color: var(--dsw-alias-state-error-primary); }
      .vm-input, .vm-textarea, .vm-select {
        width: 100%; box-sizing: border-box; border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
        font: inherit; font-size: 12px; line-height: 1.45; padding: 7px 9px;
      }
      .vm-input::placeholder, .vm-textarea::placeholder { color: var(--dsw-alias-label-secondary); opacity: .8; }
      .vm-textarea { resize: vertical; min-height: 62px; }
      .vm-select { appearance: none; cursor: pointer; }
      .vm-hint { font-size: 10px; line-height: 1.45; color: var(--dsw-alias-label-secondary); }
      .vm-key-row { display: flex; gap: 8px; align-items: center; }
      .vm-key-row .vm-input { flex: 1; min-width: 0; }
      .vm-role {
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
        padding: 9px; margin-bottom: 8px; background: var(--dsw-alias-bg-base);
      }
      .vm-role-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .vm-role-index {
        font-size: 10px; color: var(--dsw-alias-label-secondary); flex: none;
        min-width: 18px; height: 18px; border-radius: 999px; display: grid; place-items: center;
        background: var(--dsw-alias-bg-layer-2);
      }
      .vm-link-btn {
        border: 0; background: transparent; padding: 2px 0; cursor: pointer;
        font: inherit; font-size: 11px; color: var(--dsw-alias-brand-primary);
      }
      .vm-link-btn.danger { color: var(--dsw-alias-state-error-primary); margin-left: auto; }
      .vm-modal-foot {
        display: flex; justify-content: flex-end; gap: 8px;
        padding: 12px 18px; border-top: 1px solid var(--dsw-alias-border-l1);
      }
      .vm-primary, .vm-secondary {
        height: 30px; padding: 0 14px; border-radius: 8px; cursor: pointer;
        font: inherit; font-size: 12px; border: 1px solid transparent;
      }
      .vm-primary { background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }
      .vm-primary:disabled { opacity: .6; cursor: default; }
      .vm-secondary {
        background: transparent; color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-border-l1);
      }
      .vm-secondary:hover { background: var(--dsw-alias-bg-layer-2); }
      .vm-modal-error {
        margin: 0 0 10px; padding: 8px 10px; border-radius: 8px;
        font-size: 11px; line-height: 1.45; color: var(--dsw-alias-state-error-primary);
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);
      }
      .vm-empty-state { padding: 20px 4px; text-align: center; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      @keyframes vm-spin { to { transform: rotate(360deg); } }
      @keyframes vm-pulse {
        0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); }
        50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-error-primary) 0%, transparent); }
      }
      @media (max-width: 560px) {
        .vm-mode-btn { max-width: 110px; }
        .vm-modal { max-height: calc(100vh - 24px); }
        .vm-modal-backdrop { padding: 12px; }
      }

      /* UI refresh: compact idle controls, expanded capture row, richer menu. */
      .vm-root[data-expanded="true"] { width: 100%; }
      .vm-idle { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
      .vm-mode-btn {
        max-width: 176px; padding: 0 10px 0 8px; gap: 6px;
      }
      .vm-mode-icon {
        width: 18px; height: 18px; flex: none; display: inline-flex;
        align-items: center; justify-content: center; color: var(--dsw-alias-brand-primary);
      }
      .vm-mode-icon svg { width: 14px; height: 14px; display: block; }
      .vm-warn-dot { box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent); }
      .vm-capture {
        flex: 1; min-width: 0; height: 32px; display: flex; align-items: center; gap: 8px;
        padding: 0 6px; border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
      }
      .vm-capture-btn {
        width: 24px; height: 24px; padding: 0; flex: none; display: grid; place-items: center;
        border: 0; border-radius: 999px; background: transparent; cursor: pointer;
        color: var(--dsw-alias-label-secondary);
        transition: background .12s ease, color .12s ease;
      }
      .vm-capture-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .vm-capture-btn svg { width: 13px; height: 13px; display: block; }
      .vm-capture-btn.vm-stop {
        background: var(--dsw-alias-state-error-primary);
        color: var(--dsw-alias-bg-base);
      }
      .vm-capture-btn.vm-stop:hover {
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 82%, var(--dsw-alias-label-primary));
        color: var(--dsw-alias-bg-base);
      }
      .vm-capture .vm-spinner { color: var(--dsw-alias-brand-primary); flex: none; }
      .vm-waveform {
        flex: 1; min-width: 72px; height: 22px; display: flex; align-items: center;
        justify-content: center; gap: 2px; overflow: hidden;
        color: var(--dsw-alias-state-error-primary);
      }
      .vm-wave-bar {
        width: 2px; height: 18px; border-radius: 999px; background: currentColor;
        transform: scaleY(.18); transform-origin: center;
        transition: transform .08s linear, opacity .08s linear;
        opacity: .5;
      }
      .vm-rec-dot {
        width: 6px; height: 6px; border-radius: 999px; flex: none;
        background: var(--dsw-alias-state-error-primary);
        animation: vm-rec-pulse 1.4s ease-in-out infinite;
      }
      .vm-timer {
        font-size: 11px; line-height: 1; font-variant-numeric: tabular-nums;
        color: var(--dsw-alias-label-secondary); flex: none; min-width: 34px; text-align: right;
      }
      .vm-capture-text {
        flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-size: 11.5px; line-height: 1; color: var(--dsw-alias-label-secondary);
      }
      .vm-sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
      }
      .vm-menu {
        width: min(288px, calc(100vw - 16px));
        max-height: min(440px, 70vh);
        padding: 6px; border-radius: 14px;
        scrollbar-width: thin;
      }
      .vm-menu-heading { padding: 8px 9px 5px; }
      .vm-menu-item {
        align-items: center; gap: 9px; padding: 8px; border-radius: 10px;
        transition: background .12s ease;
      }
      .vm-menu-item[aria-checked="true"], .vm-menu-item[aria-selected="true"] {
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);
      }
      .vm-menu-icon {
        width: 27px; height: 27px; flex: none; display: grid; place-items: center;
        border-radius: 8px; color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-2);
        transition: background .12s ease, color .12s ease;
      }
      .vm-menu-icon svg { width: 15px; height: 15px; display: block; }
      .vm-menu-item[aria-checked="true"] .vm-menu-icon {
        color: var(--dsw-alias-brand-primary);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, transparent);
      }
      .vm-menu-check {
        width: 14px; height: 14px; margin: 0 0 0 auto; flex: none;
        color: var(--dsw-alias-brand-primary); opacity: 0;
      }
      .vm-menu-check:not(.empty) { opacity: 1; }
      .vm-menu-copy { gap: 1px; }
      .vm-menu-name { font-size: 12.5px; }
      .vm-menu-desc { font-size: 10.5px; }
      .vm-menu-settings { padding: 8px; border-radius: 10px; }
      .vm-status { display: inline-flex; align-items: center; gap: 5px; }
      .vm-status-dot {
        width: 5px; height: 5px; border-radius: 999px; flex: none;
        background: var(--dsw-alias-state-warn-primary);
      }
      .vm-status.ok .vm-status-dot { background: var(--dsw-alias-state-success-primary); }
      .vm-modal-backdrop {
        background: color-mix(in srgb, var(--dsw-alias-bg-base) 62%, transparent);
        backdrop-filter: blur(6px) saturate(.92);
      }
      .vm-modal { width: min(640px, 100%); border-radius: 18px; }
      .vm-modal-body { padding: 16px 20px 20px; }
      .vm-input:focus, .vm-textarea:focus, .vm-select:focus {
        outline: none;
        border-color: var(--dsw-alias-brand-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
      }
      .vm-primary, .vm-secondary { height: 32px; border-radius: 9px; }
      .vm-role { border-radius: 12px; }
      @keyframes vm-rec-pulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-error-primary) 34%, transparent); }
        50% { opacity: .55; box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-error-primary) 0%, transparent); }
      }
      @media (prefers-reduced-motion: reduce) {
        .vm-mic, .vm-mode-btn, .vm-wave-bar, .vm-menu-item { transition: none; }
        .vm-mic[data-phase="recording"], .vm-rec-dot { animation: none; }
      }
      @media (max-width: 560px) {
        .vm-mode-btn { max-width: 124px; }
        .vm-capture { gap: 5px; }
        .vm-waveform { min-width: 48px; }
        .vm-timer { min-width: 30px; }
      }

      /* Floating white menu, layered over DSH surfaces. */
      .vm-menu {
        z-index: 90000;
        background: #ffffff;
        color: #18181b;
        border-color: rgba(24, 24, 27, .08);
        max-height: min(620px, calc(100vh - 24px));
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        box-shadow:
          0 28px 80px rgba(15, 23, 42, .22),
          0 8px 24px rgba(15, 23, 42, .12),
          0 0 0 1px rgba(15, 23, 42, .03);
        animation: vm-menu-in .16s cubic-bezier(.2, .8, .2, 1);
        transform-origin: bottom center;
        scrollbar-width: thin;
      }
      .vm-menu-heading, .vm-menu-desc, .vm-menu-empty, .vm-menu-settings svg { color: #71717a; }
      .vm-menu-name, .vm-menu-settings { color: #18181b; }
      .vm-menu-item:hover, .vm-menu-settings:hover { background: #f4f4f5; }
      .vm-menu-item[aria-checked="true"], .vm-menu-item[aria-selected="true"] {
        background: #eef4ff;
      }
      .vm-menu-icon {
        width: 28px; height: 28px; border-radius: 11px;
        background: #f4f4f5; color: #71717a;
      }
      .vm-menu-item[aria-checked="true"] .vm-menu-icon {
        color: var(--dsw-alias-brand-primary);
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, #ffffff);
      }
      .vm-menu-check { color: var(--dsw-alias-brand-primary); }
      .vm-menu-sep { background: rgba(24, 24, 27, .08); }
      .vm-menu-heading-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px; padding: 8px 9px 5px;
      }
      .vm-menu-heading-row .vm-menu-heading { padding: 0; }
      .vm-menu-count {
        min-width: 18px; height: 17px; padding: 0 5px; border-radius: 999px;
        display: inline-flex; align-items: center; justify-content: center;
        background: #f4f4f5; color: #71717a;
        font-size: 10px; line-height: 1; font-variant-numeric: tabular-nums;
      }
      .vm-role-strip {
        display: flex; overflow-x: auto; overflow-y: hidden;
        max-height: 196px; padding: 6px;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
        scrollbar-color: rgba(24, 24, 27, .18) transparent;
      }
      .vm-role-strip::-webkit-scrollbar { height: 4px; }
      .vm-role-strip::-webkit-scrollbar-track { background: transparent; }
      .vm-role-strip::-webkit-scrollbar-thumb {
        background: rgba(24, 24, 27, .16); border-radius: 999px;
      }
      .vm-role-page {
        flex: 0 0 100%; min-width: 0; scroll-snap-align: start;
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-auto-rows: 40px; gap: 5px; align-content: start;
      }
      .vm-role-card {
        min-width: 0; height: 40px; padding: 4px 3px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 2px; cursor: pointer;
        border: 1px solid rgba(24, 24, 27, .08); border-radius: 10px;
        background: #fafafa; color: #18181b; font: inherit;
        transition: background .12s ease, border-color .12s ease, color .12s ease;
      }
      .vm-role-card:hover { background: #f4f4f5; border-color: rgba(24, 24, 27, .14); }
      .vm-role-card[aria-checked="true"] {
        background: #eef4ff;
        border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 36%, #ffffff);
      }
      .vm-role-card svg { width: 13px; height: 13px; color: #71717a; flex: none; }
      .vm-role-card[aria-checked="true"] svg { color: var(--dsw-alias-brand-primary); }
      .vm-role-name {
        max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-size: 10.5px; line-height: 1.15;
      }
      .vm-status { color: #b45309; }
      .vm-status.ok { color: #15803d; }
      .vm-modal-backdrop { z-index: 100000; }
      @keyframes vm-menu-in {
        from { opacity: 0; transform: translateY(6px) scale(.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .vm-menu { animation: none; }
        .vm-role-card { transition: none; }
      }
      @media (max-width: 560px) {
        .vm-menu { max-height: min(560px, calc(100vh - 16px)); }
        .vm-role-page { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }

      /* Perfect circles for the microphone and capture controls. */
      .vm-mic, .vm-capture-btn { border-radius: 50%; }
      .vm-spinner { border-radius: 50%; }

      /* Dedicated full-page settings surface replacing the old small modal. */
      .vm-modal-backdrop {
        z-index: 100000;
        display: flex; align-items: stretch; justify-content: center;
        padding: 0;
        background: var(--dsw-alias-bg-base);
        backdrop-filter: none;
      }
      .vm-modal {
        width: 100%; max-width: none; height: 100%; max-height: none;
        border: 0; border-radius: 0; background: var(--dsw-alias-bg-base);
        box-shadow: none;
      }
      .vm-modal-head {
        flex: none; position: sticky; top: 0; z-index: 2;
        padding: 20px max(28px, calc((100vw - 780px) / 2)) 14px;
        background: var(--dsw-alias-bg-base);
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .vm-modal-title { font-size: 20px; line-height: 1.3; }
      .vm-modal-sub { margin-top: 4px; font-size: 12px; }
      .vm-icon-btn { width: 32px; height: 32px; border-radius: 10px; }
      .vm-modal-body {
        flex: 1; min-height: 0; overflow-y: auto;
        width: 100%; max-width: 780px; margin: 0 auto;
        padding: 24px 28px 32px;
      }
      .vm-modal-foot {
        flex: none;
        width: 100%; max-width: 780px; margin: 0 auto;
        padding: 14px 28px 20px;
        background: var(--dsw-alias-bg-base);
      }
      .vm-section {
        margin: 0 0 12px; padding: 16px 18px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 14px;
        background: var(--dsw-alias-bg-layer-1);
      }
      .vm-section + .vm-section {
        border-top: 1px solid var(--dsw-alias-border-l1);
        margin-top: 0;
      }
      .vm-section-title { font-size: 14px; margin-bottom: 4px; }
      .vm-section-hint { margin-bottom: 12px; }
      .vm-field { margin-bottom: 12px; }
      .vm-role { background: var(--dsw-alias-bg-base); }
      @media (max-width: 560px) {
        .vm-modal-head { padding: 16px 16px 12px; }
        .vm-modal-body { padding: 16px; }
        .vm-modal-foot { padding: 12px 16px 16px; }
        .vm-modal-title { font-size: 18px; }
      }

      /* Give the role heading extra breathing room above its grid. */
      .vm-menu-heading-row { padding-bottom: 4px; }

      /* Flat settings sections: hierarchy from type and spacing, not borders. */
      .vm-section {
        margin: 0 0 32px; padding: 0;
        border: 0; border-radius: 0; background: transparent;
      }
      .vm-section + .vm-section {
        margin-top: 0; padding-top: 0; border-top: 0;
      }
      .vm-section-title {
        margin: 0 0 4px;
        font-size: 16px; font-weight: 650; line-height: 1.35;
        letter-spacing: -.01em;
      }
      .vm-section-hint {
        margin: 0 0 16px;
        font-size: 12px; line-height: 1.55;
      }
      .vm-section-head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 16px; margin-bottom: 14px;
      }
      .vm-section-head-copy { min-width: 0; }
      .vm-section-head .vm-section-title { margin-bottom: 3px; }
      .vm-section-head .vm-section-hint { margin-bottom: 0; }
      .vm-add-role {
        height: 30px; padding: 0 12px; flex: none;
        display: inline-flex; align-items: center; gap: 5px;
        border: 1px solid transparent; border-radius: 9px; cursor: pointer;
        background: var(--dsw-alias-brand-primary);
        color: var(--dsw-alias-bg-base);
        font: inherit; font-size: 12px; font-weight: 500; line-height: 1;
      }
      .vm-add-role:hover {
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, var(--dsw-alias-label-primary));
      }
      .vm-add-role svg { width: 12px; height: 12px; display: block; }
      .vm-role-list {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;
      }
      .vm-role-summary {
        min-width: 0; display: flex; align-items: flex-start; gap: 10px;
        padding: 12px; text-align: left; cursor: pointer;
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
        background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 74%, transparent);
        color: var(--dsw-alias-label-primary); font: inherit;
        transition: background .12s ease, border-color .12s ease;
      }
      .vm-role-summary:hover {
        background: var(--dsw-alias-bg-layer-2);
        border-color: var(--dsw-alias-border-l2);
      }
      .vm-role-summary-icon {
        width: 28px; height: 28px; flex: none; border-radius: 9px;
        display: grid; place-items: center;
        background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);
        color: var(--dsw-alias-brand-primary);
      }
      .vm-role-summary-icon svg { width: 14px; height: 14px; }
      .vm-role-summary-copy {
        flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;
      }
      .vm-role-summary-name {
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-size: 12.5px; font-weight: 600; line-height: 1.3;
      }
      .vm-role-summary-prompt {
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        overflow: hidden; color: var(--dsw-alias-label-secondary);
        font-size: 11px; line-height: 1.45;
      }
      .vm-role-summary-edit {
        flex: none; margin-top: 2px; opacity: 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 10.5px; line-height: 1;
        transition: opacity .12s ease;
      }
      .vm-role-summary:hover .vm-role-summary-edit { opacity: 1; }
      .vm-role-empty {
        padding: 18px; border-radius: 12px; text-align: center;
        background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 74%, transparent);
        color: var(--dsw-alias-label-secondary); font-size: 12px;
      }
      .vm-add-role:focus-visible, .vm-role-summary:focus-visible,
      .vm-role-delete:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
      }
      .vm-role-modal-backdrop {
        position: fixed; inset: 0; z-index: 100010;
        display: grid; place-items: center; padding: 20px;
        background: color-mix(in srgb, var(--dsw-alias-bg-base) 52%, transparent);
        backdrop-filter: blur(5px);
      }
      .vm-role-modal {
        width: min(560px, 100%); max-height: min(680px, calc(100vh - 40px));
        display: flex; flex-direction: column; overflow: hidden;
        border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-label-primary);
        box-shadow: 0 24px 70px color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);
      }
      .vm-role-modal-head {
        flex: none; display: flex; align-items: flex-start; gap: 12px;
        padding: 16px 18px 12px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .vm-role-modal-title {
        margin: 0; font-size: 15px; font-weight: 600; line-height: 1.35;
      }
      .vm-role-modal-hint {
        margin: 3px 0 0; font-size: 11px; line-height: 1.5;
        color: var(--dsw-alias-label-secondary);
      }
      .vm-role-modal-body { padding: 16px 18px; overflow: auto; }
      .vm-role-modal-body .vm-field:last-child { margin-bottom: 0; }
      .vm-role-modal-body .vm-textarea { min-height: 150px; }
      .vm-role-modal-foot {
        flex: none; display: flex; align-items: center; gap: 8px;
        padding: 12px 18px;
        border-top: 1px solid var(--dsw-alias-border-l1);
      }
      .vm-role-modal-spacer { flex: 1; }
      .vm-role-delete {
        border: 0; background: transparent; padding: 4px 0; cursor: pointer;
        color: var(--dsw-alias-state-error-primary);
        font: inherit; font-size: 11px;
      }
      .vm-role-delete:hover { text-decoration: underline; }
      @media (max-width: 640px) {
        .vm-role-list { grid-template-columns: 1fr; }
        .vm-section { margin-bottom: 26px; }
        .vm-section-head { gap: 10px; }
        .vm-role-modal-backdrop { padding: 12px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .vm-role-summary, .vm-role-summary-edit { transition: none; }
      }
    `

    function useLocale(locale) {
      const [, force] = useState(0)
      useEffect(() => locale.subscribe(() => force((value) => value + 1)), [locale])
      return { t: locale.bind(NS) }
    }

    function VoiceModes({ inputActions, sessionId, locale, onActiveChange }) {
      const [phase, setPhase] = useState('idle')
      const [seconds, setSeconds] = useState(0)
      const [mode, setModeState] = useState(readStoredMode)
      const [roleId, setRoleIdState] = useState(readStoredRole)
      const [settings, setSettings] = useState(null)
      const [settingsError, setSettingsError] = useState('')
      const [settingsOpen, setSettingsOpen] = useState(false)
      const [draft, setDraft] = useState(null)
      const [saving, setSaving] = useState(false)
      const [saveError, setSaveError] = useState('')
      const [menuOpen, setMenuOpen] = useState(false)
      const [menuPosition, setMenuPosition] = useState(null)
      const [roleEditor, setRoleEditor] = useState(null)

      const rootRef = useRef(null)
      const modeButtonRef = useRef(null)
      const menuRef = useRef(null)
      const modalRef = useRef(null)
      const roleModalRef = useRef(null)
      const recorderRef = useRef(null)
      const streamRef = useRef(null)
      const chunksRef = useRef([])
      const timerRef = useRef(null)
      const startedAtRef = useRef(0)
      const mountedRef = useRef(true)
      const modeRef = useRef(mode)
      const roleIdRef = useRef(roleId)
      const audioContextRef = useRef(null)
      const analyserRef = useRef(null)
      const audioSourceRef = useRef(null)
      const waveBarsRef = useRef([])
      const activeChangeRef = useRef(onActiveChange)

      const { t } = useLocale(locale)

      const roles = settings?.roles ?? FALLBACK_ROLES
      const activeRole = roles.find((role) => role.id === roleId) ?? null

      modeRef.current = mode
      roleIdRef.current = roleId
      activeChangeRef.current = onActiveChange
      const expanded = phase === 'recording'
      const roleEditorOpen = roleEditor !== null

      useEffect(() => {
        mountedRef.current = true
        return () => {
          mountedRef.current = false
          clearTimer()
          const recorder = recorderRef.current
          recorderRef.current = null
          if (recorder && recorder.state !== 'inactive') {
            try {
              recorder.stop()
            } catch {
              // Already stopped.
            }
          }
          releaseStream()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      useEffect(() => {
        activeChangeRef.current?.(expanded)
        return () => {
          activeChangeRef.current?.(false)
        }
      }, [expanded])

      useEffect(() => {
        if (phase !== 'recording') return undefined
        const analyser = analyserRef.current
        if (!analyser) return undefined
        const data = new Uint8Array(analyser.fftSize)
        const levels = new Array(WAVE_BARS).fill(0.08)
        let frame
        let previous = 0
        const draw = (now) => {
          if (now - previous >= 55) {
            previous = now
            analyser.getByteTimeDomainData(data)
            let sum = 0
            for (let index = 0; index < data.length; index += 1) {
              const value = (data[index] - 128) / 128
              sum += value * value
            }
            const rms = Math.sqrt(sum / data.length)
            levels.pop()
            levels.unshift(Math.min(1, rms * 6))
            const bars = waveBarsRef.current
            for (let index = 0; index < bars.length; index += 1) {
              const bar = bars[index]
              if (!bar) continue
              const level = levels[index] ?? 0.08
              bar.style.transform = `scaleY(${(0.18 + level * 0.82).toFixed(3)})`
              bar.style.opacity = String(0.45 + level * 0.55)
            }
          }
          frame = requestAnimationFrame(draw)
        }
        frame = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(frame)
      }, [phase])

      useEffect(() => {
        let cancelled = false
        callApi('/settings', { method: 'GET' })
          .then((data) => {
            if (cancelled) return
            setSettings(data.settings)
            setSettingsError('')
          })
          .catch((error) => {
            if (cancelled) return
            setSettingsError(formatError(error, t, inputActions.notify))
          })
        return () => {
          cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      useEffect(() => {
        if (!settings) return
        if (roleId && !settings.roles.some((role) => role.id === roleId)) {
          setRoleIdState('')
          store(STORAGE_ROLE, '')
          if (mode === 'role') setMode('direct')
        }
      }, [settings, roleId, mode])

      useEffect(() => {
        if (!menuOpen) return undefined
        const update = () => {
          const button = modeButtonRef.current
          if (!button) return
          const rect = button.getBoundingClientRect()
          const width = Math.min(288, window.innerWidth - 16)
          const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8))
          setMenuPosition({ left, bottom: window.innerHeight - rect.top + 8 })
        }
        const onPointerDown = (event) => {
          const target = event.target
          if (menuRef.current?.contains(target)) return
          if (modeButtonRef.current?.contains(target)) return
          setMenuOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setMenuOpen(false)
        }
        update()
        window.addEventListener('resize', update)
        window.addEventListener('scroll', update, true)
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown)
        return () => {
          window.removeEventListener('resize', update)
          window.removeEventListener('scroll', update, true)
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown)
        }
      }, [menuOpen])

      useEffect(() => {
        if (!settingsOpen) return undefined
        const timer = setTimeout(() => {
          const first = modalRef.current?.querySelector('input, textarea, select')
          first?.focus()
        }, 0)
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          if (roleEditorOpen) {
            setRoleEditor(null)
            return
          }
          setSettingsOpen(false)
          setSaveError('')
        }
        document.addEventListener('keydown', onKeyDown)
        return () => {
          clearTimeout(timer)
          document.removeEventListener('keydown', onKeyDown)
        }
      }, [settingsOpen, roleEditorOpen])

      useEffect(() => {
        if (!roleEditorOpen) return undefined
        const timer = setTimeout(() => {
          roleModalRef.current?.querySelector('input, textarea')?.focus()
        }, 0)
        return () => clearTimeout(timer)
      }, [roleEditorOpen])

      useEffect(() => {
        if (!settingsOpen) setRoleEditor(null)
      }, [settingsOpen])

      useEffect(() => {
        if (settingsOpen && !draft && settings) setDraft(makeDraft(settings))
      }, [settingsOpen, draft, settings])

      function clearTimer() {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }

      function releaseStream() {
        const source = audioSourceRef.current
        audioSourceRef.current = null
        try {
          source?.disconnect?.()
        } catch {
          // The source may already be disconnected.
        }
        analyserRef.current = null
        const context = audioContextRef.current
        audioContextRef.current = null
        if (context) {
          try {
            const closing = context.close?.()
            if (closing?.catch) closing.catch(() => {})
          } catch {
            // The context may already be closed.
          }
        }
        const stream = streamRef.current
        streamRef.current = null
        stream?.getTracks?.().forEach((track) => track.stop())
      }

      function notify(level, message) {
        try {
          inputActions.notify(level, message)
        } catch {
          // Notifications are best-effort.
        }
      }

      function setMode(next) {
        setModeState(next)
        store(STORAGE_MODE, next)
      }

      function setRole(next) {
        setRoleIdState(next)
        store(STORAGE_ROLE, next)
      }

      async function loadSettings() {
        setSettingsError('')
        try {
          const data = await callApi('/settings', { method: 'GET' })
          setSettings(data.settings)
          setDraft(makeDraft(data.settings))
        } catch (error) {
          setSettingsError(formatError(error, t, notify))
        }
      }

      function openSettings() {
        setMenuOpen(false)
        setSaveError('')
        setRoleEditor(null)
        if (settings) setDraft(makeDraft(settings))
        setSettingsOpen(true)
        if (!settings && !settingsError) void loadSettings()
      }

      async function beginRecording() {
        if (phase !== 'idle') return
        setMenuOpen(false)
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
          notify('error', t('micUnsupported'))
          return
        }
        if (settings && !settings.hasAsrApiKey) {
          notify('error', t('errorNotConfigured'))
          openSettings()
          return
        }

        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          })
        } catch {
          notify('error', t('micPermission'))
          return
        }
        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        chunksRef.current = []
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext
          if (AudioCtx) {
            const audioContext = new AudioCtx()
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            analyser.smoothingTimeConstant = 0.78
            source.connect(analyser)
            audioContextRef.current = audioContext
            audioSourceRef.current = source
            analyserRef.current = analyser
            const resumed = audioContext.resume?.()
            if (resumed?.catch) resumed.catch(() => {})
          }
        } catch {
          // Recording works without a level analyser.
        }
        const mimeType = chooseMimeType()
        let recorder
        try {
          recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
        } catch {
          releaseStream()
          notify('error', t('micUnsupported'))
          return
        }

        recorderRef.current = recorder
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
        }
        recorder.onerror = () => {
          recorder.onstop = null
          recorder.ondataavailable = null
          clearTimer()
          releaseStream()
          recorderRef.current = null
          if (mountedRef.current) setPhase('idle')
          notify('error', t('errorAudio'))
        }
        recorder.onstop = () => {
          clearTimer()
          releaseStream()
          recorderRef.current = null
          if (!mountedRef.current) return
          const chunks = chunksRef.current
          chunksRef.current = []
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          if (!blob.size) {
            setPhase('idle')
            notify('error', t('errorAudio'))
            return
          }
          void finishRecording(blob)
        }

        startedAtRef.current = Date.now()
        setSeconds(0)
        setPhase('recording')
        try {
          recorder.start()
        } catch {
          releaseStream()
          recorderRef.current = null
          setPhase('idle')
          notify('error', t('micUnsupported'))
          return
        }

        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
          if (mountedRef.current) setSeconds(elapsed)
          if (elapsed >= MAX_RECORDING_SECONDS) {
            notify('info', t('recordingLimit'))
            stopRecording()
          }
        }, 250)
      }

      function stopRecording() {
        const recorder = recorderRef.current
        if (!recorder || recorder.state === 'inactive') return
        setPhase('processing')
        try {
          recorder.stop()
        } catch {
          clearTimer()
          releaseStream()
          recorderRef.current = null
          setPhase('idle')
        }
      }

      function cancelRecording() {
        const recorder = recorderRef.current
        recorderRef.current = null
        if (recorder && recorder.state !== 'inactive') {
          recorder.onstop = null
          recorder.ondataavailable = null
          try {
            recorder.stop()
          } catch {
            // Already stopped.
          }
        }
        chunksRef.current = []
        clearTimer()
        releaseStream()
        setPhase('idle')
        setSeconds(0)
      }

      async function finishRecording(blob) {
        setPhase('processing')
        try {
          const upload = (await convertToWav(blob)) ?? blob
          const audio = await blobToBase64(upload)
          const data = await callApi('/process', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              audio,
              mime: upload.type,
              mode: modeRef.current,
              roleId: roleIdRef.current,
            }),
          })
          if (!mountedRef.current) return
          if (data.fallback) notify('info', t('fallbackUsed'))
          const span = inputActions.captureInsertion()
          const inserted = inputActions.insertText(data.text, span)
          if (!inserted) {
            try {
              await navigator.clipboard.writeText(data.text)
              notify('info', t('insertFailed'))
            } catch {
              notify('error', t('copyFailed'))
            }
          }
        } catch (error) {
          if (!mountedRef.current) return
          notify('error', formatError(error, t, notify))
          if (error?.code === 'not-configured' || error?.code === 'text-not-configured') openSettings()
        } finally {
          if (mountedRef.current) setPhase('idle')
        }
      }

      function updateDraft(field, value) {
        setDraft((current) => (current ? { ...current, [field]: value } : current))
      }

      function openRoleEditor(index) {
        if (!draft) return
        if (index === null) {
          setRoleEditor({ index: null, name: '', prompt: '', error: '' })
          return
        }
        const role = draft.roles[index]
        if (!role) return
        setRoleEditor({ index, name: role.name, prompt: role.prompt, error: '' })
      }

      function updateRoleEditor(field, value) {
        setRoleEditor((current) => (current ? { ...current, [field]: value, error: '' } : current))
      }

      function closeRoleEditor() {
        setRoleEditor(null)
      }

      function saveRoleEditor() {
        const editor = roleEditor
        if (!editor) return
        const name = editor.name.trim()
        const prompt = editor.prompt.trim()
        if (!name || !prompt) {
          setRoleEditor({ ...editor, error: t('roleValidation') })
          return
        }
        setDraft((current) => {
          if (!current) return current
          if (editor.index === null) {
            return {
              ...current,
              roles: [...current.roles, { id: randomId(), name, prompt }],
            }
          }
          return {
            ...current,
            roles: current.roles.map((role, index) =>
              index === editor.index ? { ...role, name, prompt } : role,
            ),
          }
        })
        setRoleEditor(null)
      }

      function deleteRoleEditor() {
        const editor = roleEditor
        if (!editor) return
        if (editor.index !== null) {
          setDraft((current) =>
            current
              ? {
                  ...current,
                  roles: current.roles.filter((_, index) => index !== editor.index),
                }
              : current,
          )
        }
        setRoleEditor(null)
      }

      async function save() {
        if (!draft) return
        setSaveError('')
        if (!draft.asrUrl.trim()) {
          setSaveError(t('validationAsrUrl'))
          return
        }
        if (!draft.hasAsrApiKey && !draft.asrApiKey.trim()) {
          setSaveError(t('validationAsrKey'))
          return
        }
        if (!draft.roles.length) {
          setSaveError(t('validationRoles'))
          return
        }
        if (draft.roles.some((role) => !role.name.trim() || !role.prompt.trim())) {
          setSaveError(t('validationRoleFields'))
          return
        }

        const payload = {
          asrUrl: draft.asrUrl,
          asrModel: draft.asrModel,
          secondaryUrl: draft.secondaryUrl,
          secondaryModel: draft.secondaryModel,
          roles: draft.roles.map((role) => ({
            id: role.id,
            name: role.name.trim(),
            prompt: role.prompt.trim(),
          })),
        }
        if (draft.asrApiKey.trim()) payload.asrApiKey = draft.asrApiKey.trim()
        if (draft.secondaryApiKey.trim()) payload.secondaryApiKey = draft.secondaryApiKey.trim()

        setSaving(true)
        try {
          const data = await callApi('/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!mountedRef.current) return
          setSettings(data.settings)
          setDraft(makeDraft(data.settings))
          setSettingsOpen(false)
          notify('info', t('saved'))
        } catch (error) {
          if (!mountedRef.current) return
          setSaveError(
            `${t('saveFailed')}：${error?.detail || formatError(error, t, notify)}`,
          )
        } finally {
          if (mountedRef.current) setSaving(false)
        }
      }

      function renderMic() {
        if (phase === 'processing') {
          return h('button', {
            type: 'button',
            className: 'vm-mic',
            'data-phase': 'processing',
            'aria-label': t('micProcessing'),
            title: t('micProcessing'),
            disabled: true,
          }, h('span', { className: 'vm-spinner', 'aria-hidden': true }))
        }
        if (phase === 'recording') {
          return h('button', {
            type: 'button',
            className: 'vm-mic',
            'data-phase': 'recording',
            'aria-label': t('micStop'),
            title: `${t('micStop')} · ${t('recording')} ${seconds}s`,
            'aria-pressed': true,
            onClick: stopRecording,
          }, stopIcon())
        }
        return h('button', {
          type: 'button',
          className: 'vm-mic',
          'data-phase': 'idle',
          'aria-label': t('micStart'),
          title: t('micStart'),
          onClick: () => void beginRecording(),
        }, micIcon())
      }

      function renderCaptureRow() {
        const isRecording = phase === 'recording'
        return h(
          'div',
          {
            className: 'vm-capture',
            'data-phase': phase,
            role: 'group',
            'aria-label': isRecording ? t('recordingNow') : t('micProcessing'),
          },
          isRecording
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'vm-capture-btn',
                  'aria-label': t('cancelRecording'),
                  title: t('cancelRecording'),
                  onClick: cancelRecording,
                },
                closeIcon(),
              )
            : h('span', { className: 'vm-spinner', 'aria-hidden': true }),
          isRecording ? h('span', { className: 'vm-rec-dot', 'aria-hidden': true }) : null,
          isRecording
            ? h(
                'div',
                { className: 'vm-waveform', role: 'img', 'aria-label': t('recording') },
                Array.from({ length: WAVE_BARS }, (_, index) =>
                  h('span', {
                    key: index,
                    className: 'vm-wave-bar',
                    ref: (node) => {
                      waveBarsRef.current[index] = node
                    },
                  }),
                ),
              )
            : h(
                'span',
                { className: 'vm-capture-text', role: 'status', 'aria-live': 'polite' },
                t('processingShort'),
              ),
          isRecording ? h('span', { className: 'vm-timer' }, formatTimer(seconds)) : null,
          isRecording
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'vm-capture-btn vm-stop',
                  'aria-label': t('micStop'),
                  title: t('micStop'),
                  onClick: stopRecording,
                },
                stopIcon(),
              )
            : null,
        )
      }

      function renderModeButton() {
        const label = modeLabel(mode, activeRole, t)
        return h(
          'button',
          {
            type: 'button',
            ref: modeButtonRef,
            className: 'vm-mode-btn',
            'aria-label': `${t('modeButton')}：${label}`,
            'aria-haspopup': 'menu',
            'aria-expanded': menuOpen,
            title: `${t('modeButton')} · ${label}`,
            onClick: () => setMenuOpen((open) => !open),
          },
          h('span', { className: 'vm-mode-icon', 'aria-hidden': true }, modeIcon(mode)),
          h('span', { className: 'vm-mode-text' }, label),
          h('span', { 'aria-hidden': true, style: { display: 'inline-flex' } }, chevronIcon()),
          settings && !settings.hasAsrApiKey
            ? h('span', {
                className: 'vm-warn-dot',
                'aria-hidden': true,
                title: t('asrMissing'),
              })
            : null,
        )
      }

      function renderModeMenu() {
        if (!menuOpen) return null
        const entries = [
          { key: 'direct', name: t('modeDirect'), desc: t('modeDirectDesc') },
          { key: 'optimize', name: t('modeOptimize'), desc: t('modeOptimizeDesc') },
          { key: 'translate', name: t('modeTranslate'), desc: t('modeTranslateDesc') },
        ]
        return h(
          'div',
          {
            className: 'vm-menu',
            ref: menuRef,
            role: 'menu',
            'aria-label': t('modeMenuTitle'),
            style: menuPosition
              ? { left: `${menuPosition.left}px`, bottom: `${menuPosition.bottom}px` }
              : { visibility: 'hidden' },
          },
          h('div', { className: 'vm-menu-heading' }, t('modeMenuTitle')),
          ...entries.map((entry) =>
            h(
              'button',
              {
                type: 'button',
                key: entry.key,
                className: 'vm-menu-item',
                role: 'menuitemradio',
                'aria-checked': mode === entry.key,
                onClick: () => {
                  setMode(entry.key)
                  setMenuOpen(false)
                },
              },
              h('span', { className: 'vm-menu-icon', 'aria-hidden': true }, modeIcon(entry.key)),
              h(
                'span',
                { className: 'vm-menu-copy' },
                h('span', { className: 'vm-menu-name' }, entry.name),
                h('span', { className: 'vm-menu-desc' }, entry.desc),
              ),
              h(
                'span',
                { className: `vm-menu-check${mode === entry.key ? '' : ' empty'}` },
                checkIcon(),
              ),
            ),
          ),
          h('div', { className: 'vm-menu-sep' }),
          h(
            'div',
            { className: 'vm-menu-heading-row' },
            h('div', { className: 'vm-menu-heading' }, t('customRoles')),
            roles.length ? h('span', { className: 'vm-menu-count' }, String(roles.length)) : null,
          ),
          roles.length
            ? h(
                'div',
                { className: 'vm-role-strip', role: 'group', 'aria-label': t('customRoles') },
                Array.from({ length: Math.ceil(roles.length / 16) }, (_, pageIndex) => {
                  const page = roles.slice(pageIndex * 16, pageIndex * 16 + 16)
                  return h(
                    'div',
                    { className: 'vm-role-page', key: pageIndex, role: 'presentation' },
                    page.map((role) =>
                      h(
                        'button',
                        {
                          type: 'button',
                          key: role.id,
                          className: 'vm-role-card',
                          role: 'menuitemradio',
                          'aria-checked': mode === 'role' && roleId === role.id,
                          'aria-label': role.name,
                          title: role.name,
                          onClick: () => {
                            setRole(role.id)
                            setMode('role')
                            setMenuOpen(false)
                          },
                        },
                        modeIcon('role'),
                        h('span', { className: 'vm-role-name' }, role.name),
                      ),
                    ),
                  )
                }),
              )
            : h('div', { className: 'vm-menu-empty' }, t('noRoles')),
          h('div', { className: 'vm-menu-sep' }),
          h(
            'button',
            {
              type: 'button',
              className: 'vm-menu-settings',
              role: 'menuitem',
              onClick: openSettings,
            },
            gearIcon(),
            h('span', null, t('settings')),
            h(
              'span',
              { className: `vm-status${settings?.hasAsrApiKey ? ' ok' : ''}` },
              settings
                ? h('span', { className: 'vm-status-dot', 'aria-hidden': true })
                : null,
              settings ? (settings.hasAsrApiKey ? t('asrReady') : t('asrMissing')) : '',
            ),
          ),
        )
      }

      function renderSettingsModal() {
        if (!settingsOpen) return null
        return h(
          'div',
          {
            className: 'vm-modal-backdrop',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) {
                setSettingsOpen(false)
                setSaveError('')
              }
            },
          },
          h(
            'div',
            {
              className: 'vm-modal',
              ref: modalRef,
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': t('settingsTitle'),
            },
            h(
              'div',
              { className: 'vm-modal-head' },
              h(
                'div',
                null,
                h('h2', { className: 'vm-modal-title' }, t('settingsTitle')),
                h('p', { className: 'vm-modal-sub' }, t('settingsSubtitle')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'vm-icon-btn',
                  'aria-label': t('close'),
                  title: t('close'),
                  onClick: () => {
                    setSettingsOpen(false)
                    setSaveError('')
                  },
                },
                closeIcon(),
              ),
            ),
            h(
              'div',
              { className: 'vm-modal-body' },
              saveError ? h('p', { className: 'vm-modal-error' }, saveError) : null,
              !draft
                ? h(
                    'div',
                    { className: 'vm-empty-state' },
                    settingsError || t('loading'),
                    settingsError
                      ? h(
                          'div',
                          { style: { marginTop: '8px' } },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'vm-secondary',
                              onClick: () => void loadSettings(),
                            },
                            t('retry'),
                          ),
                        )
                      : null,
                  )
                : h(
                    'div',
                    null,
                    h(
                      'section',
                      { className: 'vm-section' },
                      h('h3', { className: 'vm-section-title' }, t('asrSection')),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h('label', { className: 'vm-label' }, t('asrUrl'), h('span', { className: 'vm-required' }, '*')),
                        h('input', {
                          className: 'vm-input',
                          value: draft.asrUrl,
                          placeholder: t('asrUrlPlaceholder'),
                          spellCheck: false,
                          onChange: (event) => updateDraft('asrUrl', event.target.value),
                        }),
                        h('span', { className: 'vm-hint' }, t('asrUrlHint')),
                        h(
                          'span',
                          { className: 'vm-hint' },
                          `${t('providerCatalogHint')} ${(draft.asrProviders ?? [])
                            .map((provider) => providerName(provider, t))
                            .filter(Boolean)
                            .join(' / ')}`,
                        ),
                        draft.asrProvider
                          ? h(
                              'span',
                              { className: 'vm-hint' },
                              `${t('providerDetected')}: ${providerName(draft.asrProvider, t)}`,
                            )
                          : null,
                        draft.asrProvider?.id === 'xiaomi-mimo'
                          ? h('span', { className: 'vm-hint' }, t('providerMimoHint'))
                          : null,
                      ),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h(
                          'label',
                          { className: 'vm-label' },
                          t('asrKey'),
                          h('span', { className: 'vm-required' }, '*'),
                        ),
                        h('input', {
                          className: 'vm-input',
                          type: 'password',
                          autoComplete: 'new-password',
                          value: draft.asrApiKey,
                          placeholder: draft.hasAsrApiKey ? t('asrKeySaved') : t('asrKeyMissing'),
                          onChange: (event) => updateDraft('asrApiKey', event.target.value),
                        }),
                      ),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h('label', { className: 'vm-label' }, t('asrModel')),
                        h('input', {
                          className: 'vm-input',
                          value: draft.asrModel,
                          placeholder: 'whisper-1',
                          spellCheck: false,
                          onChange: (event) => updateDraft('asrModel', event.target.value),
                        }),
                      ),
                    ),
                    h(
                      'section',
                      { className: 'vm-section' },
                      h('h3', { className: 'vm-section-title' }, t('secondSection')),
                      h('p', { className: 'vm-section-hint' }, t('secondHint')),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h('label', { className: 'vm-label' }, t('secondUrl')),
                        h('input', {
                          className: 'vm-input',
                          value: draft.secondaryUrl,
                          placeholder: t('secondUrlPlaceholder'),
                          spellCheck: false,
                          onChange: (event) => updateDraft('secondaryUrl', event.target.value),
                        }),
                      ),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h('label', { className: 'vm-label' }, t('secondKey')),
                        h('input', {
                          className: 'vm-input',
                          type: 'password',
                          autoComplete: 'new-password',
                          value: draft.secondaryApiKey,
                          placeholder: draft.hasSecondaryApiKey
                            ? t('asrKeySaved')
                            : t('asrKeyMissing'),
                          onChange: (event) => updateDraft('secondaryApiKey', event.target.value),
                        }),
                      ),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h('label', { className: 'vm-label' }, t('secondModel')),
                        h('input', {
                          className: 'vm-input',
                          value: draft.secondaryModel,
                          placeholder: 'gpt-4o-mini',
                          spellCheck: false,
                          onChange: (event) => updateDraft('secondaryModel', event.target.value),
                        }),
                      ),
                    ),
                    h(
                      'section',
                      { className: 'vm-section' },
                      h('h3', { className: 'vm-section-title' }, t('targetSection')),
                      h(
                        'div',
                        { className: 'vm-field' },
                        h('label', { className: 'vm-label' }, t('targetLanguage')),
                        h(
                          'select',
                          {
                            className: 'vm-select',
                            value: 'en',
                            disabled: true,
                            onChange: () => {},
                          },
                          h('option', { value: 'en' }, t('targetEnglish')),
                        ),
                      ),
                    ),
                    h(
                      'section',
                      { className: 'vm-section' },
                      h(
                        'div',
                        { className: 'vm-section-head' },
                        h(
                          'div',
                          { className: 'vm-section-head-copy' },
                          h('h3', { className: 'vm-section-title' }, t('rolesSection')),
                          h('p', { className: 'vm-section-hint' }, t('rolesHint')),
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'vm-add-role',
                            onClick: () => openRoleEditor(null),
                          },
                          plusIcon(),
                          h('span', null, t('addRole')),
                        ),
                      ),
                      draft.roles.length
                        ? h(
                            'div',
                            { className: 'vm-role-list' },
                            draft.roles.map((role, index) =>
                              h(
                                'button',
                                {
                                  type: 'button',
                                  key: role.id,
                                  className: 'vm-role-summary',
                                  'aria-label': `${t('editRole')} ${role.name}`,
                                  onClick: () => openRoleEditor(index),
                                },
                                h(
                                  'span',
                                  { className: 'vm-role-summary-icon', 'aria-hidden': true },
                                  modeIcon('role'),
                                ),
                                h(
                                  'span',
                                  { className: 'vm-role-summary-copy' },
                                  h('span', { className: 'vm-role-summary-name' }, role.name),
                                  h('span', { className: 'vm-role-summary-prompt' }, role.prompt),
                                ),
                                h('span', { className: 'vm-role-summary-edit' }, t('editRole')),
                              ),
                            ),
                          )
                        : h('div', { className: 'vm-role-empty' }, t('noRoles')),
                    ),
                  ),
            ),
            draft
              ? h(
                  'div',
                  { className: 'vm-modal-foot' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'vm-secondary',
                      onClick: () => {
                        setSettingsOpen(false)
                        setSaveError('')
                      },
                    },
                    t('cancel'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'vm-primary',
                      disabled: saving,
                      onClick: () => void save(),
                    },
                    saving ? t('saving') : t('save'),
                  ),
                )
              : null,
          ),
        )
      }

      function renderRoleEditor() {
        if (!roleEditor) return null
        const isNew = roleEditor.index === null
        return h(
          'div',
          {
            className: 'vm-role-modal-backdrop',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) closeRoleEditor()
            },
          },
          h(
            'div',
            {
              className: 'vm-role-modal',
              ref: roleModalRef,
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': isNew ? t('roleDialogNewTitle') : t('roleDialogEditTitle'),
            },
            h(
              'div',
              { className: 'vm-role-modal-head' },
              h(
                'div',
                null,
                h(
                  'h3',
                  { className: 'vm-role-modal-title' },
                  isNew ? t('roleDialogNewTitle') : t('roleDialogEditTitle'),
                ),
                h('p', { className: 'vm-role-modal-hint' }, t('roleDialogHint')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'vm-icon-btn',
                  'aria-label': t('close'),
                  title: t('close'),
                  onClick: closeRoleEditor,
                },
                closeIcon(),
              ),
            ),
            h(
              'div',
              { className: 'vm-role-modal-body' },
              roleEditor.error ? h('p', { className: 'vm-modal-error' }, roleEditor.error) : null,
              h(
                'div',
                { className: 'vm-field' },
                h('label', { className: 'vm-label' }, t('roleName')),
                h('input', {
                  className: 'vm-input',
                  value: roleEditor.name,
                  placeholder: t('roleNamePlaceholder'),
                  onChange: (event) => updateRoleEditor('name', event.target.value),
                }),
              ),
              h(
                'div',
                { className: 'vm-field' },
                h('label', { className: 'vm-label' }, t('rolePrompt')),
                h('textarea', {
                  className: 'vm-textarea',
                  value: roleEditor.prompt,
                  placeholder: t('rolePromptPlaceholder'),
                  onChange: (event) => updateRoleEditor('prompt', event.target.value),
                }),
              ),
            ),
            h(
              'div',
              { className: 'vm-role-modal-foot' },
              !isNew
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'vm-role-delete',
                      onClick: deleteRoleEditor,
                    },
                    t('deleteRole'),
                  )
                : null,
              h('span', { className: 'vm-role-modal-spacer' }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'vm-secondary',
                  onClick: closeRoleEditor,
                },
                t('cancel'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'vm-primary',
                  onClick: saveRoleEditor,
                },
                t('saveRole'),
              ),
            ),
          ),
        )
      }

      return h(
        'div',
        {
          className: 'vm-root',
          ref: rootRef,
          'data-session': sessionId,
          'data-expanded': expanded ? 'true' : 'false',
        },
        h('style', null, STYLE),
        expanded
          ? renderCaptureRow()
          : h('div', { className: 'vm-idle' }, renderMic(), renderModeButton()),
        renderModeMenu(),
        renderSettingsModal(),
        renderRoleEditor(),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'zh', ZH), 'voice-modes: zh dictionary')
        ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'voice-modes: en dictionary')
        ctx.slots.inject('conversation.input.activity', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.activity',
            },
            (props) => h(VoiceModes, { ...props, locale: ctx.locale }),
          ),
        )
      },
    }
  },
})
