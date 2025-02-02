import SegmentActions from './es6/actions/SegmentActions'

window.Review = {
  enabled: function () {
    return config.enableReview && !!config.isReview
  },
  type: config.reviewType,
}
$.extend(window.UI, {
  evalOpenableSegment: function (segment) {
    if (!(segment.status === 'NEW' || segment.status === 'DRAFT')) return true

    if (UI.projectStats && UI.projectStats.TRANSLATED_PERC === 0) {
      alertNoTranslatedSegments()
    } else {
      alertNotTranslatedYet(segment.sid)
    }
    return false
  },
})

if (config.enableReview && config.isReview) {
  ;(function ($) {
    $.extend(UI, {
      alertNotTranslatedMessage:
        'This segment is not translated yet.<br /> Only translated segments can be revised.',
      /**
       * Each revision overwrite this function
       */
      clickOnApprovedButton: function (segment, goToNextNotApproved) {
        var sid = segment.sid
        SegmentActions.removeClassToSegment(sid, 'modified')
        var afterApproveFn = function () {
          if (goToNextNotApproved) {
            UI.openNextTranslated()
          } else {
            UI.gotoNextSegment(sid)
          }
        }

        UI.changeStatus(segment, 'approved', afterApproveFn) // this does < setTranslation
      },
    })
  })(jQuery)
}
