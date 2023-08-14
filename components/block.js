polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  entity: Ember.computed.alias('block.entity'),

  init() {
    let array = new Uint32Array(5);
    this.set('uniqueIdPrefix', window.crypto.getRandomValues(array).join(''));

    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.isSubmitting', false);
      this.set('block._state.conflictingRunning', false);
    }
    this._super(...arguments);
  },
  actions: {
    submitUrl: function () {
      this.scan();

      this.set('block._state.errorMessage', '');
      this.set('block._state.scanResult', '');
      this.set('block._state.isSubmitting', true);
    },
    copyData: function () {
      Ember.run.scheduleOnce(
        'afterRender',
        this,
        this.copyElementToClipboard,
        `nmap-container-${this.get('uniqueIdPrefix')}`
      );

      Ember.run.scheduleOnce('destroy', this, this.restoreCopyState);
    }
  },
  copyElementToClipboard(element) {
    window.getSelection().removeAllRanges();
    let range = document.createRange();

    range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  },
  restoreCopyState() {
    this.set('showCopyMessage', true);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.set('showCopyMessage', false);
      }
    }, 2000);
  },
  scan: function () {
    this.set('block._state.scanResult', '');
    this.set('block._state.errorMessage', '');

    const payload = {
      action: 'scan',
      entity: this.get('block.entity.value')
    };

    this.sendIntegrationMessage(payload)
      .then((response) => {
        this.set('block._state.scanResult', response.reply);
      })
      .catch((err) => {
        this.set('block._state.errorMessage', this.getErrorDetail(err));
      })
      .finally(() => {
        this.set('block._state.isSubmitting', false);
      });
  },
  getErrorDetail: (err) => {
    if (err && err.meta && err.meta.detail) {
      console.error(err.meta.detail);
      if (typeof err.meta.detail === 'string') {
        return err.meta.detail;
      } else if (err.meta.detail.message && typeof err.meta.detail.message === 'string') {
        return err.meta.detail.message;
      } else {
        return JSON.stringify(err.meta.detail.message, null, 2);
      }
    } else {
      return JSON.stringify(err, null, 2);
    }
  }
});
