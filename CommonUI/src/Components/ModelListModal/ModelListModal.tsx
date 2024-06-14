import Query from "../../Utils/BaseDatabase/Query";
import Select from "../../Utils/BaseDatabase/Select";
import Modal from "../Modal/Modal";
import ModelList from "../ModelList/ModelList";
import BaseModel from "Common/Models/BaseModel";
import React, { ReactElement, useState } from "react";

export interface ComponentProps<TBaseModel extends BaseModel> {
  query?: Query<TBaseModel>;
  onClose: () => void;
  onSave: (modals: Array<TBaseModel>) => void;
  modelType: { new (): TBaseModel };
  titleField: string;
  isSearchEnabled?: boolean | undefined;
  descriptionField?: string | undefined;
  selectMultiple?: boolean | undefined;
  select: Select<TBaseModel>;
  modalTitle: string;
  modalDescription: string;
  noItemsMessage: string;
  headerField?: string | ((item: TBaseModel) => ReactElement) | undefined;
}

const ModelListModal: <TBaseModel extends BaseModel>(
  props: ComponentProps<TBaseModel>,
) => ReactElement = <TBaseModel extends BaseModel>(
  props: ComponentProps<TBaseModel>,
): ReactElement => {
  const [selectedList, setSelectedList] = useState<Array<TBaseModel>>([]);

  return (
    <Modal
      title={props.modalTitle}
      description={props.modalDescription}
      onClose={props.onClose}
      disableSubmitButton={selectedList.length === 0}
      onSubmit={() => {
        if (selectedList && selectedList.length === 0) {
          props.onClose();
        }

        props.onSave(selectedList);
      }}
    >
      <ModelList<TBaseModel>
        {...props}
        id="model-list-modal"
        onSelectChange={(list: Array<TBaseModel>) => {
          setSelectedList([...list]);
        }}
      />
    </Modal>
  );
};

export default ModelListModal;
