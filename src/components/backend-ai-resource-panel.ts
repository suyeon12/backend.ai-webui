/**
 @license
 Copyright (c) 2015-2020 Lablup Inc. All rights reserved.
 */

import {get as _text, translate as _t, translateUnsafeHTML as _tr} from "lit-translate";
import {css, customElement, html, property} from "lit-element";
import {BackendAIPage} from './backend-ai-page';

import 'weightless/icon';
import 'weightless/progress-bar';

import '@material/mwc-linear-progress/mwc-linear-progress';
import '@material/mwc-icon';
import '@material/mwc-icon-button';

import './lablup-activity-panel';
import './lablup-loading-spinner';
import './lablup-progress-bar';
import './backend-ai-resource-monitor';
import './backend-ai-release-check';
import '../plastics/lablup-shields/lablup-shields';
import '../plastics/lablup-piechart/lablup-piechart';

import {default as PainKiller} from "./backend-ai-painkiller";
import {BackendAiStyles} from "./backend-ai-general-styles";
import {IronFlex, IronFlexAlignment, IronPositioning} from "../plastics/layout/iron-flex-layout-classes";

/**
 `<backend-ai-resource-panel>` is a Summary panel of backend.ai console.

 Example:
 <backend-ai-resource-panel active></backend-ai-resource-panel>

 @group Lablup Elements
 @element backend-ai-resource-panel
 */

@customElement("backend-ai-resource-panel")
export default class BackendAIResourcePanel extends BackendAIPage {
  @property({type: String}) condition = 'running';
  @property({type: Number}) sessions = 0;
  @property({type: Object}) jobs = Object();
  @property({type: Number}) agents = 0;
  @property({type: Boolean}) is_admin = false;
  @property({type: Boolean}) is_superadmin = false;
  @property({type: Object}) resources = Object();
  @property({type: Boolean}) authenticated = false;
  @property({type: String}) manager_version = '';
  @property({type: String}) console_version = '';
  @property({type: Number}) cpu_total = 0;
  @property({type: Number}) cpu_used = 0;
  @property({type: String}) cpu_percent = '0';
  @property({type: String}) cpu_total_percent = '0';
  @property({type: Number}) cpu_total_usage_ratio = 0;
  @property({type: Number}) cpu_current_usage_ratio = 0;
  @property({type: String}) mem_total = '0';
  @property({type: String}) mem_used = '0';
  @property({type: String}) mem_allocated = '0';
  @property({type: Number}) mem_total_usage_ratio = 0;
  @property({type: Number}) mem_current_usage_ratio = 0;
  @property({type: String}) mem_current_usage_percent = '0';
  @property({type: Number}) cuda_gpu_total = 0;
  @property({type: Number}) cuda_gpu_used = 0;
  @property({type: Number}) cuda_fgpu_total = 0;
  @property({type: Number}) cuda_fgpu_used = 0;
  @property({type: Number}) rocm_gpu_total = 0;
  @property({type: Number}) rocm_gpu_used = 0;
  @property({type: Number}) tpu_total = 0;
  @property({type: Number}) tpu_used = 0;
  @property({type: Object}) spinner = Object();
  @property({type: Object}) notification = Object();
  @property({type: Object}) resourcePolicy;
  @property({type: String}) announcement = '';
  @property({type: Number}) height = 0;

  constructor() {
    super();
  }

  static get styles() {
    return [
      BackendAiStyles,
      IronFlex,
      IronFlexAlignment,
      IronPositioning,
      // language=CSS
      css`
        ul {
          padding-left: 0;
        }

        ul li {
          list-style: none;
          font-size: 14px;
        }

        li:before {
          padding: 3px;
          transform: rotate(-45deg) translateY(-2px);
          transition: color ease-in .2s;
          border: solid;
          border-width: 0 2px 2px 0;
          border-color: #242424;
          margin-right: 10px;
          content: '';
          display: inline-block;
        }

        span.indicator {
          width: 100px;
        }

        div.card {
          margin: 20px;
        }

        div.big.indicator {
          font-size: 48px;
        }

        a,
        a:visited {
          color: #222222;
        }

        a:hover {
          color: #3e872d;
        }

        mwc-linear-progress {
          width: 260px;
          height: 15px;
          border-radius: 0;
          --mdc-theme-primary: #3677eb;
        }

        mwc-linear-progress.start-bar {
          border-top-left-radius: 3px;
          border-top-right-radius: 3px;
          --mdc-theme-primary: #3677eb;
        }

        mwc-linear-progress.end-bar {
          border-bottom-left-radius: 3px;
          border-bottom-right-radius: 3px;
          --mdc-theme-primary: #98be5a;
        }

        wl-icon {
          --icon-size: 24px;
        }

        mwc-icon-button.update-button {
          --mdc-icon-size: 16px;
          --mdc-icon-button-size: 24px;
          color: red;
        }

        mwc-icon.update-icon {
          --mdc-icon-size: 16px;
          --mdc-icon-button-size: 24px;
          color: black;
        }

        img.resource-type-icon {
          width: 16px;
          height: 16px;
          margin-right: 5px;
        }

        div.indicators {
          min-height: 80px;
          padding: 15px 20px 5px 20px;
          background-color: #F6F6F6;
        }

        .system-health-indicator {
          width: 90px;
        }

        .resource {
          margin-bottom: 10px;
          margin-left: 5px;
          height: 46px;
        }

        .resource-line {
          margin-left: 85px;
        }
      `
    ];
  }

  firstUpdated() {
    this.spinner = this.shadowRoot.querySelector('#loading-spinner');
    this.notification = globalThis.lablupNotification;
  }

  _refreshHealthPanel() {
    if (this.activeConnected) {
      this._refreshSessionInformation();
      if (this.is_superadmin) {
        this._refreshAgentInformation();
      }
    }
  }

  _refreshSessionInformation() {
    if (!this.activeConnected) {
      return;
    }
    this.spinner.show();
    let status = 'RUNNING';
    switch (this.condition) {
      case 'running':
        status = 'RUNNING';
        break;
      case 'finished':
        status = 'TERMINATED';
        break;
      case 'archived':
      default:
        status = 'RUNNING';
    }
    let fields = ["created_at"];
    globalThis.backendaiclient.computeSession.list(fields, status).then((response) => {
      this.spinner.hide();
      this.jobs = response;
      if (!response.compute_session_list && response.legacy_compute_session_list) {
        response.compute_session_list = response.legacy_compute_session_list;
      }
      this.sessions = response.compute_session_list.total_count;
      if (this.active) {
        setTimeout(() => {
          this._refreshSessionInformation()
        }, 15000);
      }
    }).catch(err => {
      this.spinner.hide();
      this.jobs = [];
      this.sessions = 0;
      this.notification.text = PainKiller.relieve('Couldn\'t connect to manager.');
      this.notification.detail = err;
      this.notification.show(true, err);
    });
  }

  _refreshResourceInformation() {
    if (!this.activeConnected) {
      return;
    }
    return globalThis.backendaiclient.resourcePolicy.get(globalThis.backendaiclient.resource_policy).then((response) => {
      let rp = response.keypair_resource_policies;
      this.resourcePolicy = globalThis.backendaiclient.utils.gqlToObject(rp, 'name');
    });
  }

  _refreshAgentInformation(status: string = 'running') {
    if (!this.activeConnected) {
      return;
    }
    switch (this.condition) {
      case 'running':
        status = 'ALIVE';
        break;
      case 'finished':
        status = 'TERMINATED';
        break;
      case 'archived':
      default:
        status = 'ALIVE';
    }
    this.spinner.show();

    globalThis.backendaiclient.resources.totalResourceInformation().then((response) => {
      this.spinner.hide();
      this.resources = response;
      this._sync_resource_values();
      if (this.active == true) {
        setTimeout(() => {
          this._refreshAgentInformation(status)
        }, 15000);
      }
      this._changeProgressbar();
    }).catch(err => {
      this.spinner.hide();
      if (err && err.message) {
        this.notification.text = PainKiller.relieve(err.title);
        this.notification.detail = err.message;
        this.notification.show(true, err);
      }
    });
  }

  _changeProgressbar() {
    const reservedCPU = this._addComma(this.cpu_used) + '/' + this._addComma(this.cpu_total) + ' ' + _text('summary.CoresReserved') + '.';
    const reservedMem = this._addComma(this.mem_allocated) + '/' + this._addComma(this.mem_total) + 'GB ' + _text('summary.reserved') + '.';
    let reservedGPU;
    let reservedFGPU;
    let reservedROCM;
    let reservedTPU;
    const usingCPU = _text('summary.Using') + this.cpu_total_percent +  '% (util. ' + this.cpu_percent + ' %)';
    let memUsedPct = parseInt(this.mem_used)!== 0 ? (parseInt(this.mem_used) / parseInt(this.mem_total) * 100).toFixed(0) : '0';
    const usingMem = _text('summary.Using') + this._addComma(this.mem_used) + 'GB' + ' (' +  memUsedPct +' %)';
    this.shadowRoot.querySelector('#cpu-usage-bar').change(this.cpu_total_usage_ratio, reservedCPU);
    this.shadowRoot.querySelector('#cpu-usage-bar-2').change(this.cpu_current_usage_ratio, usingCPU);
    this.shadowRoot.querySelector('#mem-usage-bar').change(this.mem_total_usage_ratio, reservedMem);
    this.shadowRoot.querySelector('#mem-usage-bar-2').change(this.mem_current_usage_ratio, usingMem);
    if (this.cuda_gpu_total) {
      reservedGPU = this.cuda_gpu_used + '/' + this.cuda_gpu_total + ' CUDA GPUs ' + _text('summary.reserved') + '.';
      let gpuPct = this.cuda_gpu_used !== 0 ? this.cuda_gpu_used / this.cuda_gpu_total : 0;
      this.shadowRoot.querySelector('#gpu-usage-bar').change(gpuPct, reservedGPU);
      this.shadowRoot.querySelector('#gpu-usage-bar-2').change(gpuPct, _text('summary.FractionalGPUScalingEnabled'));
    }
    if (this.cuda_fgpu_total) {
      reservedFGPU = this.cuda_fgpu_used + '/' + this.cuda_fgpu_total + ' CUDA fGPUs ' + _text('summary.reserved') + '.';
      let fgpuPct = this.cuda_fgpu_used !== 0 ? this.cuda_fgpu_used / this.cuda_fgpu_total : 0;
      this.shadowRoot.querySelector('#fgpu-usage-bar').change(fgpuPct, reservedFGPU);
      this.shadowRoot.querySelector('#fgpu-usage-bar-2').change(fgpuPct, _text('summary.FractionalGPUScalingEnabled'));
    }
    if (this.rocm_gpu_total) {
      reservedROCM = this.rocm_gpu_used + '/' + this.rocm_gpu_total + ' ROCm GPUs ' + _text('summary.reserved') + '.';
      let rocmPct = this.rocm_gpu_used !== 0 ? this.rocm_gpu_used / 100 : 0
      this.shadowRoot.querySelector('#rocm-gpu-usage-bar').change(rocmPct, reservedROCM);
      this.shadowRoot.querySelector('#rocm-gpu-usage-bar-2').change(rocmPct, _text('summary.ROCMGPUEnabled'));
    }
    if (this.tpu_total) {
      reservedTPU = this.tpu_used + '/' + this.tpu_total+ ' TPUs ' + _text('summary.reserved') + '.';
      let tpuPct = this.tpu_used !== 0 ? this.tpu_used / this.tpu_total : 0;
      this.shadowRoot.querySelector('#tpu-usage-bar').change(tpuPct, reservedTPU);
      this.shadowRoot.querySelector('#tpu-usage-bar-2').change(tpuPct, _text('summary.TPUEnabled'));
    }
  }

  _init_resource_values() {
    this.resources.cpu = {};
    this.resources.cpu.total = 0;
    this.resources.cpu.used = 0;
    this.resources.cpu.percent = 0;
    this.resources.mem = {};
    this.resources.mem.total = 0;
    this.resources.mem.allocated = 0;
    this.resources.mem.used = 0;
    this.resources.cuda_gpu = {};
    this.resources.cuda_gpu.total = 0;
    this.resources.cuda_gpu.used = 0;
    this.resources.cuda_fgpu = {};
    this.resources.cuda_fgpu.total = 0;
    this.resources.cuda_fgpu.used = 0;
    this.resources.agents = {};
    this.resources.agents.total = 0;
    this.resources.agents.using = 0;
    this.cpu_total_usage_ratio = 0;
    this.cpu_current_usage_ratio = 0;
    this.mem_total_usage_ratio = 0;
    this.mem_current_usage_ratio = 0;
    this.mem_current_usage_percent = "0";
    this.is_admin = false;
    this.is_superadmin = false;
  }

  _sync_resource_values() {
    this.manager_version = globalThis.backendaiclient.managerVersion;
    this.console_version = globalThis.packageVersion;
    this.cpu_total = this.resources.cpu.total;
    this.mem_total = parseFloat(globalThis.backendaiclient.utils.changeBinaryUnit(this.resources.mem.total, 'g')).toFixed(2);
    if (isNaN(this.resources['cuda.device'].total)) {
      this.cuda_gpu_total = 0;
    } else {
      this.cuda_gpu_total = this.resources['cuda.device'].total;
    }
    if (isNaN(this.resources['cuda.shares'].total)) {
      this.cuda_fgpu_total = 0;
    } else {
      this.cuda_fgpu_total = this.resources['cuda.shares'].total;
    }
    this.cpu_used = this.resources.cpu.used;
    this.cuda_gpu_used = this.resources['cuda.device'].used;
    this.cuda_fgpu_used = this.resources['cuda.shares'].used;

    this.cpu_percent = parseFloat(this.resources.cpu.percent).toFixed(2);
    this.cpu_total_percent = this.cpu_used !== 0 ? ((this.cpu_used / this.cpu_total) * 100).toFixed(2) : '0';
    // this.cpu_total_percent = ((parseFloat(this.cpu_percent) / (this.cpu_total * 100.0)) * 100.0).toFixed(2);
    this.cpu_total_usage_ratio = this.resources.cpu.used / this.resources.cpu.total * 100.0;
    this.cpu_current_usage_ratio = this.resources.cpu.percent / this.resources.cpu.total;


    // mem.total: total memory
    // mem.allocated: allocated by backend.ai
    // mem.used: used by backend.ai
    this.mem_used = parseFloat(globalThis.backendaiclient.utils.changeBinaryUnit(this.resources.mem.used, 'g')).toFixed(2);
    this.mem_allocated = parseFloat(globalThis.backendaiclient.utils.changeBinaryUnit(this.resources.mem.allocated, 'g')).toFixed(2);
    this.mem_total_usage_ratio = this.resources.mem.allocated / this.resources.mem.total * 100.0;
    this.mem_current_usage_ratio = this.resources.mem.used / this.resources.mem.total * 100.0;

    if (this.mem_total_usage_ratio === 0) { // Not allocated (no session presents)
      this.mem_current_usage_percent = '0.0';
    } else {
      this.mem_current_usage_percent = this.mem_total_usage_ratio.toFixed(2);//(this.mem_allocated / this.mem_total_usage_ratio * 100.0).toFixed(2);
    }
    this.agents = this.resources.agents.total;

    if (isNaN(parseFloat(this.mem_current_usage_percent))) {
      this.mem_current_usage_percent = '0';
    }
  }

  async _viewStateChanged(active: boolean) {
    await this.updateComplete;
    if (active === false) {
      return;
    }
    this._init_resource_values();
    if (typeof globalThis.backendaiclient === "undefined" || globalThis.backendaiclient === null || globalThis.backendaiclient.ready === false) {
      document.addEventListener('backend-ai-connected', () => {
        this.is_superadmin = globalThis.backendaiclient.is_superadmin;
        this.is_admin = globalThis.backendaiclient.is_admin;
        this.authenticated = true;
        if (this.activeConnected) {
          this._refreshHealthPanel();
          this.requestUpdate();
          //let event = new CustomEvent("backend-ai-resource-refreshed", {"detail": {}});
          //document.dispatchEvent(event);
        }
      }, true);
    } else {
      this.is_superadmin = globalThis.backendaiclient.is_superadmin;
      this.is_admin = globalThis.backendaiclient.is_admin;
      this.authenticated = true;
      this._refreshHealthPanel();
      this.requestUpdate();
      //let event = new CustomEvent("backend-ai-resource-refreshed", {"detail": {}});
      //document.dispatchEvent(event);
    }
  }

  _toInt(value: number) {
    return Math.ceil(value);
  }

  _countObject(obj: object) {
    return Object.keys(obj).length;
  }

  _addComma(num: any) {
    if (num === undefined) {
      return '';
    }
    var regexp = /\B(?=(\d{3})+(?!\d))/g;
    return num.toString().replace(regexp, ',');
  }

  render() {
    // language=HTML
    return html`
      <lablup-loading-spinner id="loading-spinner"></lablup-loading-spinner>
      <lablup-activity-panel title="${_t('summary.SystemResources')}" elevation="1" narrow height="${this.height}">
        <div slot="message">
          <div class="horizontal justified layout wrap indicators">
            ${this.is_superadmin ? html`
              <div class="vertical layout center system-health-indicator">
                <div class="big indicator">${this.agents}</div>
                <span>${_tr('summary.ConnectedNodes')}</span>
              </div>` : html``}
            <div class="vertical layout center system-health-indicator">
              <div class="big indicator">${this.sessions}</div>
              <span>${_t('summary.ActiveSessions')}</span>
            </div>
          </div>
          <div class="vertical-card" style="align-items: flex-start">
            ${this.is_superadmin ? html`
            <div class="layout horizontal center flex resource">
              <div class="layout vertical center center-justified resource-name">
                <div class="gauge-name">CPU</div>
              </div>
              <div class="layout vertical start-justified wrap">
                <lablup-progress-bar id="cpu-usage-bar" class="start"></lablup-progress-bar>
                <lablup-progress-bar id="cpu-usage-bar-2" class="end"></lablup-progress-bar>
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${this._addComma(this.cpu_used)}/${this._addComma(this.cpu_total)} ${_t('summary.CoresReserved')}.
                  </span>
                  <mwc-linear-progress class="mem-usage-bar start-bar"
                      progress="${this.cpu_total_usage_ratio / 100.0}"></mwc-linear-progress>
                </div>-->
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${_t('summary.Using')} ${this.cpu_total_percent} % (util. ${this.cpu_percent} %)
                  </span>
                  <mwc-linear-progress class="mem-usage-bar end-bar" id="cpu-usage-bar"
                  progress="${this.cpu_current_usage_ratio / 100.0}"
                  buffer="${this.cpu_current_usage_ratio / 100.0}"></mwc-linear-progress>
                </div>-->
              </div>
              <div class="layout vertical center center-justified">
                <span class="percentage start-bar">${parseInt(this.cpu_total_percent)+ '%'}</span>
                <span class="percentage end-bar">${parseInt(this.cpu_percent) + '%'}</span>
              </div>
            </div>
            <div class="resource-line"></div>
            <div class="layout horizontal center flex resource">
              <div class="layout vertical center center-justified resource-name">
                <div class="gauge-name">RAM</div>
              </div>
              <div class="layout vertical start-justified wrap">
                <lablup-progress-bar id="mem-usage-bar" class="start"></lablup-progress-bar>
                <lablup-progress-bar id="mem-usage-bar-2" class="end"></lablup-progress-bar>
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${this._addComma(this.mem_allocated)} / ${this._addComma(this.mem_total)} GB ${_t('summary.reserved')}.
                  </span>

                  <mwc-linear-progress class="mem-usage-bar start-bar" id="mem-usage-bar"
                        progress="${this.mem_total_usage_ratio / 100.0}"></mwc-linear-progress>
                </div>-->
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${_t('summary.Using')} ${this._addComma(this.mem_used)} GB
                    (${parseInt(this.mem_used)!== 0 ? (parseInt(this.mem_used) / parseInt(this.mem_total) * 100).toFixed(0) : '0' } %)
                  </span>
                  <mwc-linear-progress class="mem-usage-bar end-bar"
                  progress="${this.mem_current_usage_ratio / 100.0}"
                  buffer="${this.mem_current_usage_ratio / 100.0}"></mwc-linear-progress>
                </div>-->
              </div>
              <div class="layout vertical center center-justified">
                <span class="percentage start-bar">${this.mem_total_usage_ratio.toFixed(1) + '%'}</span>
                <span class="percentage end-bar">${(parseInt(this.mem_used)!== 0 ? (parseInt(this.mem_used) / parseInt(this.mem_total) * 100).toFixed(0) : '0' ) + '%'}</span>
              </div>
            </div>
            ${this.cuda_gpu_total || this.cuda_fgpu_total || this.rocm_gpu_total || this.tpu_total ? html`
            <div class="resource-line"></div>
            <div class="layout horizontal center flex resource">
              <div class="layout vertical center center-justified resource-name">
                <div class="gauge-name">GPU</div>
              </div>
              ${this.cuda_gpu_total ? html`
              <div class="layout vertical start-justified wrap">
              <lablup-progress-bar id="gpu-usage-bar" class="start"></lablup-progress-bar>
              <lablup-progress-bar id="gpu-usage-bar-2" class="end"></lablup-progress-bar>
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${this.cuda_gpu_used} / ${this.cuda_gpu_total} CUDA GPUs ${_t('summary.reserved')}.
                  </span>
                  <mwc-linear-progress id="gpu-bar"
                  progress="${this.cuda_gpu_used / this.cuda_gpu_total}"></mwc-linear-progress>
                </div>-->
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${_t('summary.FractionalGPUScalingEnabled')}.
                  </span>
                  <mwc-linear-progress class="mem-usage-bar end-bar"
                  progress="" buffer=""></mwc-linear-progress>
                </div>-->
              </div>
              <div class="layout vertical center center-justified">
                <span class="percentage start-bar">${this.cuda_gpu_used !== 0 ? (this.cuda_gpu_used / this.cuda_gpu_total * 100).toFixed(1) : 0}%</span>
                <span class="percentage end-bar">&nbsp;</span>
              </div>
              `: html``}
              ${this.cuda_fgpu_total ? html`
              <div class="layout vertical start-justified wrap">
              <lablup-progress-bar id="fgpu-usage-bar" class="start"></lablup-progress-bar>
              <lablup-progress-bar id="fgpu-usage-bar-2" class="end"></lablup-progress-bar>
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${this.cuda_fgpu_used} / ${this.cuda_fgpu_total} CUDA fGPUs ${_t('summary.reserved')}.
                  </span>
                  <mwc-linear-progress id="gpu-bar"
                  progress="${this.cuda_fgpu_used / this.cuda_fgpu_total}"></mwc-linear-progress>
                </div>
                <div class="progress-bar">
                  <span class="gauge-label">
                    ${_t('summary.FractionalGPUScalingEnabled')}.
                  </span>
                  <mwc-linear-progress class="mem-usage-bar end-bar"
                  progress="" buffer=""></mwc-linear-progress>
                </div>-->
              </div>
              <div class="layout vertical center center-justified">
                <span class="percentage start-bar">${this.cuda_fgpu_used !== 0 ? (this.cuda_fgpu_used / this.cuda_fgpu_total * 100).toFixed(1) : 0}%</span>
                <span class="percentage end-bar">&nbsp;</span>
              </div>
              `: html``}
              ${this.rocm_gpu_total ? html`
              <div class="layout vertical start-justified wrap">
              <lablup-progress-bar id="rocm-gpu-usage-bar" class="start"></lablup-progress-bar>
              <lablup-progress-bar id="rocm-gpu-usage-bar-2" class="end"></lablup-progress-bar>
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${this.rocm_gpu_used} / ${this.rocm_gpu_total} ROCm GPUs ${_t('summary.reserved')}.
                  </span>
                  <mwc-linear-progress id="rocm-gpu-bar"
                  progress="${this.rocm_gpu_used / 100.0}"
                  buffer="${this.rocm_gpu_used / 100.0}"></mwc-linear-progress>
                </div>-->
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${_t('summary.ROCMGPUEnabled')}.
                  </span>
                  <wl-progress-bar class="end-bar" mode="determinate"
                      value="0"></wl-progress-bar>
                  <mwc-linear-progress class="mem-usage-bar end-bar"
                  progress="" buffer=""></mwc-linear-progress>
                </div>-->
              </div>
              <div class="layout vertical center center-justified">
                <span class="percentage start-bar">${this.rocm_gpu_used.toFixed(1) + '%'}</span>
                <span class="percentage end-bar">&nbsp;</span>
              </div>`: html``}
              ${this.tpu_total ? html`
              <div class="layout vertical start-justified wrap">
              <lablup-progress-bar id="tpu-usage-bar" class="start"></lablup-progress-bar>
              <lablup-progress-bar id="tpu-usage-bar-2" class="end"></lablup-progress-bar>
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${this.tpu_used} / ${this.tpu_total} TPUs ${_t('summary.reserved')}.
                  </span>
                  <mwc-linear-progress id="tpu-bar" progress="${this.tpu_used / 100.0}"
                  buffer="${this.tpu_used / 100.0}"></mwc-linear-progress>
                </div>-->
                <!--<div class="progress-bar">
                  <span class="gauge-label">
                    ${_t('summary.TPUEnabled')}.
                  </span>
                  <mwc-linear-progress class="mem-usage-bar end-bar"
                  progress="" buffer=""></mwc-linear-progress>
                </div>-->
              </div>
              <div class="layout vertical center center-justified">
                <span class="percentage start-bar">${this.tpu_used.toFixed(1) + '%'}</span>
                <span class="percentage end-bar"></span>
              </div>`: html``}
            </div>`: html``}
            <div class="vertical start layout" style="margin-top:30px;">
              <div class="horizontal layout resource-legend-stack">
                <div class="resource-legend-icon start"></div>
                <span class="resource-legend">${_t('summary.Reserved')} ${_t('resourcePolicy.Resources')}</span>
              </div>
              <div class="horizontal layout resource-legend-stack">
                <div class="resource-legend-icon end"></div>
                <span class="resource-legend">${_t('summary.Used')} ${_t('resourcePolicy.Resources')}</span>
              </div>
              <div class="horizontal layout">
                <div class="resource-legend-icon total"></div>
                <span class="resource-legend">${_t('summary.Total')} ${_t('resourcePolicy.Resources')}</span>
              </div>
            </div>` : html``}
          </div>
        </div>
      </lablup-activity-panel>
`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "backend-ai-resource-panel": BackendAIResourcePanel;
  }
}
