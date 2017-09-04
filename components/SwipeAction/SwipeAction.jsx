import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Events from '../utils/events';
import Drag from '../Drag';

class SwipeAction extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      offsetLeft: 0,
    };
    this.isOpen = false;
    this.touchEnd = true;
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  componentDidMount() {
    Events.on(document.body, 'touchstart', e => this.onCloseSwipe(e));
  }

  componentWillUnmount() {
    Events.off(document.body, 'touchstart', e => this.onCloseSwipe(e));
  }

  onDragStart() {
    if (this.isOpen) {
      this.touchEnd = false;
      this.close();
      return;
    }
    this.touchEnd = true;
  }

  onDragMove(event, { offsetX, offsetY }) {
    if (!this.touchEnd) return;

    const { disabled } = this.props;
    if (disabled) return;

    // 拖动距离达到上限
    const { offset } = this.props;
    const { offsetLeft } = this.state;
    const btnsLeftWidth = this.left && this.left.offsetWidth;
    const btnsRightWidth = this.right && this.right.offsetWidth;
    if (offsetX > 0 && (!btnsLeftWidth || offsetLeft >= btnsLeftWidth + offset)) return false;
    if (offsetX < 0 && (!btnsRightWidth || offsetLeft <= -btnsRightWidth - offset)) return false;

    // 判断滚屏情况
    const distanceX = Math.abs(offsetX);
    const distanceY = Math.abs(offsetY);
    if (distanceX < 5 || (distanceX >= 5 && distanceY >= 0.3 * distanceX)) return false;

    this.doTransition({ offsetLeft: offsetX, duration: 0 });
    return true;
  }

  onDragEnd(event, { offsetX, startTime }) {
    event.preventDefault();

    const { speed, moveDistanceRatio, moveTimeSpan } = this.props;
    const timeSpan = new Date().getTime() - startTime.getTime();
    const btnsLeftWidth = this.left && this.left.offsetWidth;
    const btnsRightWidth = this.right && this.right.offsetWidth;

    let distanceX = 0;
    let isOpen = false;

    if ((offsetX / btnsLeftWidth > moveDistanceRatio) || (offsetX > 0 && timeSpan <= moveTimeSpan)) {
      distanceX = btnsLeftWidth;
      isOpen = true;
    } else if ((offsetX / btnsRightWidth < -moveDistanceRatio) || (offsetX < 0 && timeSpan <= moveTimeSpan)) {
      distanceX = -btnsRightWidth;
      isOpen = true;
    }

    if (isOpen && !this.isOpen) {
      // 打开
      this.open(distanceX);
    } else if (!isOpen && this.isOpen) {
      // 关闭
      this.close();
    } else {
      // 还原
      this.doTransition({ offsetLeft: distanceX, duration: speed });
    }
  }

  onBtnClick(e, btn) {
    e.preventDefault();
    const onClick = btn.onClick;
    if (onClick) {
      onClick(e);
    }

    if (this.props.autoClose) {
      this.close();
    }
  }

  onCloseSwipe(e) {
    if (this.isOpen) {
      const pNode = ((node) => {
        while (node.parentNode && node.parentNode !== document.body) {
          if (node === this.wrap) {
            return node;
          }
          node = node.parentNode;
        }
      })(e.target);

      if (!pNode) {
        e.preventDefault();
        this.touchEnd = true;
        this.close();
      }
    }
  }

  open(offsetLeft) {
    const { speed, onOpen } = this.props;
    onOpen();
    this.isOpen = true;
    this.doTransition({ offsetLeft, duration: speed });
  }

  close() {
    const { speed, onClose } = this.props;
    onClose();
    this.isOpen = false;
    this.doTransition({ offsetLeft: 0, duration: speed });
  }

  doTransition({ offsetLeft, duration }) {
    this.setState({ offsetLeft, duration });
  }

  renderButtons(buttons, ref) {
    const prefixCls = this.props.prefixCls;

    return (buttons && buttons.length) ? (
      <div
        className={`${prefixCls}-actions-${ref}`}
        ref={(el) => { this[ref] = el; }}>
        {
          buttons.map((btn, i) => {
            const { theme, className, text } = btn;

            const classes = classnames({
              [`${prefixCls}-button`]: true,
              [`theme-${theme}`]: true,
              [className]: !!className,
            });

            return (
              <div
                key={+i}
                className={classes}
                onClick={e => this.onBtnClick(e, btn)}>
                <div className={`${prefixCls}-text`}>{text || `${ref}${i}`}</div>
              </div>
            );
          })
        }
      </div>
    ) : null;
  }

  render() {
    const { prefixCls, left, right, children } = this.props;
    const { offsetLeft, duration } = this.state;

    const style = {
      WebkitTransitionDuration: `${duration}ms`,
      transitionDuration: `${duration}ms`,
      WebkitTransform: `translate3d(${offsetLeft}px, 0, 0)`,
      transform: `translate3d(${offsetLeft}px, 0, 0)`,
    };

    return (left.length || right.length)
      ? (
        <div className={prefixCls} ref={(wrap) => { this.wrap = wrap; }}>
          {this.renderButtons(left, 'left')}
          {this.renderButtons(right, 'right')}
          <Drag
            onDragStart={this.onDragStart}
            onDragMove={this.onDragMove}
            onDragEnd={this.onDragEnd}>
            <div className={`${prefixCls}-content`} style={style}>
              {children}
            </div>
          </Drag>
        </div>
        )
      : children;
  }
}

SwipeAction.propTypes = {
  prefixCls: PropTypes.string,
  left: PropTypes.arrayOf(PropTypes.object),
  right: PropTypes.arrayOf(PropTypes.object),
  moveDistanceRatio: PropTypes.number,
  moveTimeSpan: PropTypes.number,
  speed: PropTypes.number,
  offset: PropTypes.number,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
};

SwipeAction.defaultProps = {
  prefixCls: 'za-swipeaction',
  left: [],
  right: [],
  moveDistanceRatio: 0.5,
  moveTimeSpan: 300,
  speed: 300,
  offset: 10,
  onOpen() {},
  onClose() {},
};

export default SwipeAction;
