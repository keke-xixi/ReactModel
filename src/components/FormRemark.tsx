import { Form, Input } from 'antd';
import type { Rule } from 'antd/es/form';

type FormRemarkProps = {
  name?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  rules?: Rule[];
};

/** 备注字段统一使用多行文本 */
const FormRemark = ({
  name = 'remark',
  label = '备注',
  required = false,
  placeholder = '请输入备注',
  rows = 3,
  rules,
}: FormRemarkProps) => {
  const mergedRules =
    rules ??
    (required ? [{ required: true, message: `请输入${label}` }] : undefined);

  return (
    <Form.Item name={name} label={label} rules={mergedRules}>
      <Input.TextArea rows={rows} placeholder={placeholder} />
    </Form.Item>
  );
};

export default FormRemark;
