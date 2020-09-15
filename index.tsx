import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import {
  Picker,
  List,
  Toast,
  Button,
  TextareaItem,
  ImagePicker,
  InputItem,
} from 'antd-mobile';
import 'antd-mobile/dist/antd-mobile.css';
import MobileRequest, { Item } from './request';
import { district, provinceLite } from 'antd-mobile-demo-data';
import { createForm } from 'rc-form';

interface IFProps {
  [key: string]: any;
}

interface PickItem {
  label: string;
  value: string;
}

function Mobile(props: IFProps) {
  const { getFieldProps, getFieldError } = props.form;

  const [communityList, setCommunityList] = useState<PickItem[]>([]);
  const [enentList, setEnentList] = useState<PickItem[]>([]);
  const [files, setFiles] = useState([]);
  const [multiple, setMultiple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [describe, setDescribe] = useState('请描述事件详情');

  useEffect(() => {
    document.title = '居民警情上报';

    getCommunitys();

    getEnents();
  }, []);

  const getCommunitys = () => {
    MobileRequest.getPlotList()
      .then((res: Item[]) => {
        const list = res.map((item: Item) => {
          return {
            value: item.id,
            label: item.name,
          };
        });
        setCommunityList(list);
      })
      .catch((error) => Toast.fail(error.message, 1));
  };

  const getEnents = () => {
    MobileRequest.getEventList()
      .then((res: Item[]) => {
        const list = res.map((item: Item) => {
          return {
            value: item.id,
            label: item.name,
            description: item.description || '请描述事件详情',
          };
        });
        setEnentList(list);
      })
      .catch((error) => Toast.fail(error.message, 1));
  };

  const dealFun = (
    community,
    eventType,
    address,
    name,
    phone,
    describe,
    fileArr = [],
    base64Arr = [],
  ) => {
    if (!fileArr.length) {
      send(community, eventType, address, name, phone, describe, base64Arr);
    } else {
      console.log('zkf 压缩前', fileArr[0].url.length / 1024);
      dealImage(fileArr[0].url, 1080, (url) => {
        console.log('zkf 压缩后', url.length / 1024);
        base64Arr.push({ url });
        dealFun(
          community,
          eventType,
          address,
          name,
          phone,
          describe,
          fileArr.slice(1),
          base64Arr,
        );
      });
    }
  };

  const submit = () => {
    const community = props.form.getFieldValue('community');
    const eventType = props.form.getFieldValue('eventType');
    const name = props.form.getFieldValue('name');
    const phone = props.form.getFieldValue('phone');
    const address = props.form.getFieldValue('address');
    const describe = props.form.getFieldValue('describe');

    if (!community) {
      Toast.fail('请选择所属小区', 1);
      return;
    }
    if (!eventType) {
      Toast.fail('请选择事件类型', 1);
      return;
    }
    if (!files.length) {
      Toast.fail('请至少上传一张图片', 1);
      return;
    }
    if (!name) {
      Toast.fail('请输入上报人姓名', 1);
      return;
    }
    if (!phone) {
      Toast.fail('请输入上报人手机', 1);
      return;
    }
    const phoneReg = /^1[3456789]\d{9}$/;
    console.log(
      'zkf',
      phone.replace(/\s+/g, ''),
      phone.replace(/\s+/g, '').match(phoneReg),
    );
    if (phone.replace(/\s+/g, '').match(phoneReg)) {
    } else {
      Toast.fail('请输入正确的手机号码', 1);
      return;
    }
    if (!address) {
      Toast.fail('请输入上报人地址', 1);
      return;
    }
    Toast.loading('上报中,请稍后...', 10);
    dealFun(community, eventType, address, name, phone, describe, files, []);

    return;
    // 返回后面的逻辑,form插件有bug或者写法不对无法进入validateFields
    props.form.validateFields((error, value) => {
      console.log('zkf', error, value);
    });
  };

  const send = (
    community,
    eventType,
    address,
    name,
    phone,
    describe,
    fileArr,
  ) => {
    setLoading(true);
    MobileRequest.addReport({
      communityId: community[0],
      eventTypeId: eventType[0],
      reportAddress: address,
      reportPersonName: name,
      phoneNumber: phone.replace(/\s+/g, ''),
      eventDesc: describe,
      imgBase64List: fileArr.map((item) => item.url.split(',')[1]),
    })
      .then((res) => {
        setLoading(false);
        Toast.success('上报成功！', 1);
      })
      .catch((error) => {
        setLoading(false);
        Toast.fail(error.message, 1);
      });
  };
  //压缩方法
  const dealImage = (base64, _w, callback) => {
    var newImage = new Image();
    var quality = 0.6; //压缩系数0-1之间
    newImage.src = base64;
    newImage.setAttribute('crossOrigin', 'Anonymous'); //url为外域时需要
    var imgWidth, imgHeight;
    newImage.onload = function() {
      imgWidth = this.width;
      imgHeight = this.height;
      const w = _w > imgWidth ? imgWidth : _w;
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      if (Math.max(imgWidth, imgHeight) > w) {
        if (imgWidth > imgHeight) {
          canvas.width = w;
          canvas.height = (w * imgHeight) / imgWidth;
        } else {
          canvas.height = w;
          canvas.width = (w * imgWidth) / imgHeight;
        }
      } else {
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        quality = 0.6;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
      var base64 = canvas.toDataURL('image/jpeg', quality); //压缩语句
      // 如想确保图片压缩到自己想要的尺寸,如要求在50-150kb之间，请加以下语句，quality初始值根据情况自定
      // while (base64.length / 1024 > 150) {
      // 	quality -= 0.01;
      // 	base64 = canvas.toDataURL("image/jpeg", quality);
      // }
      // 防止最后一次压缩低于最低尺寸，只要quality递减合理，无需考虑
      // while (base64.length / 1024 < 50) {
      // 	quality += 0.001;
      // 	base64 = canvas.toDataURL("image/jpeg", quality);
      // }
      callback(base64); //必须通过回调函数返回，否则无法及时拿到该值
    };
  };

  const PickerItem = (text: string, key: string, list: Item[]) => {
    return (
      <div className={styles.section}>
        <h5 className={styles.title}>
          {<span style={{ color: 'red' }}>* </span>}
          {text}
        </h5>
        <div className={styles.contentbox}>
          {getFieldDecorator(`${key}`, {
            rules: [
              {
                required: true,
                message: `请选择${text}`,
              },
            ],
          })(
            <Picker
              data={list}
              cols={1}
              className="forss"
              onVisibleChange={(val) => {
                console.log(val);
              }}
              onOk={(val) => {
                const listItem = list.filter((item) => item.value == val[0])[0];
                setDescribe((listItem && listItem.description) || '');
              }}
            >
              <List.Item arrow="down" />
            </Picker>,
          )}
        </div>
      </div>
    );
  };

  const TextAreaItem = (
    text: string,
    key: string,
    placeHolder: string,
    required: boolean,
    isNumber: boolean,
    validator?: () => void,
    minHeight?: string,
  ) => {
    return (
      <div className={styles.section}>
        <h5 className={styles.title}>
          {required && <span style={{ color: 'red' }}>* </span>}
          {text}
        </h5>
        <div className={styles.contentbox}>
          {getFieldDecorator(`${key}`, {
            rules: [
              {
                required: required,
                message: placeHolder,
              },
              {
                validator: validator,
              },
            ],
          })(
            isNumber ? (
              <InputItem
                labelNumber={7}
                placeholder={placeHolder}
                style={{
                  minHeight: minHeight,
                }}
                type="phone"
              />
            ) : (
              <TextareaItem
                autoHeight
                labelNumber={7}
                placeholder={!placeHolder ? describe : placeHolder}
                style={{
                  minHeight: minHeight,
                }}
              />
            ),
          )}
        </div>
      </div>
    );
  };

  const onChange = (files, type, index) => {
    console.log(files, type, index);
    setFiles(files);
  };

  const checkPhone = (rule, value, callback) => {
    const phoneReg = /^1[3456789]\d{9}$/;
    if (!value) {
      callback();
    } else {
      if (value.replace(/\s+/g, '').match(phoneReg)) {
        callback();
      } else {
        callback('请输入正确的手机号码');
      }
    }
  };

  const checkDesc = (rule, value, callback) => {
    if (!value) {
      callback();
    }
  };
  const { getFieldDecorator, resetFields } = props.form;

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {PickerItem('所属小区', 'community', communityList)}
        {PickerItem('事件类型', 'eventType', enentList)}
        {TextAreaItem(
          '事件描述',
          'describe',
          '',
          false,
          false,
          checkDesc,
          '6rem',
        )}
        <div className={styles.section}>
          <h5 className={styles.title}>
            <span style={{ color: 'red' }}>* </span> 上传图片{' '}
            <span className={styles.sectitle}>( 可上传三张 )</span>
          </h5>
          <div className={styles.contentbox}>
            <ImagePicker
              files={files}
              onChange={onChange}
              onImageClick={(index, fs) => console.log(index, fs)}
              selectable={files.length < 3}
              multiple={multiple}
              style={{ padding: '10px 0px 5px 0px' }}
            />
          </div>
        </div>
        {TextAreaItem('上报人', 'name', '请输入上报人姓名', true, false)}
        {TextAreaItem(
          '联系电话',
          'phone',
          '请输入上报人电话',
          true,
          true,
          checkPhone,
        )}
        {TextAreaItem('联系地址', 'address', '请输入上报人地址', true, false)}
        <div className={styles.btnbox}>
          <Button
            type="warning"
            style={{
              marginRight: '1rem',
              padding: '0 2rem',
              fontSize: '1.5rem',
            }}
            onClick={() => {
              setFiles([]);
              resetFields();
            }}
          >
            重置
          </Button>
          <Button
            type="primary"
            inline
            onClick={(e) => {
              e.preventDefault();
              submit();
            }}
            loading={loading}
            style={{ padding: '0 2rem', fontSize: '1.5rem' }}
          >
            上报
          </Button>
        </div>
      </div>
    </div>
  );
}
const MobileWrapper = createForm()(Mobile);
export default MobileWrapper;
