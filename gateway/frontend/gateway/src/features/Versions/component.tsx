import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, Button as B } from 'components';
import { initWalletController, useDeployer } from 'services';
import styled from 'styled-components';
import moment from 'moment';
import { downloadFile } from 'toolkit';
import { NavLink } from 'react-router-dom';

const AddButton = styled(B)``;
const Button = styled(B)``;
const Title = styled(Text)``;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px;
  border: 1px solid grey;

  & > *:not(:last-child) {
    margin-bottom: 8px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;

  ${Title} {
    margin-bottom: 64px;
  }
  ${AddButton} {
    align-self: flex-start;
    margin-bottom: 16px;
  }

  ${Item}:not(:last-child) {
    margin-bottom: 8px;
  }
`;

export interface VersionsProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Versions = ({ ...p }: VersionsProps) => {
  const [canisterToCreateVersion, setCanisterToCreateVersion] = useState('');
  const { canister, data, fetching } = useDeployer(process.env.UNION_DEPLOYER_CANISTER_ID);

  useEffect(() => {
    canister.get_binary_controller();
    canister
      .get_binary_versions()
      .then(({ versions }) => canister.get_binary_version_infos({ versions }));
  }, []);

  useEffect(() => {
    const binaryController = data.get_binary_controller?.toString();

    if (!binaryController) {
      return;
    }

    const controller = initWalletController(binaryController);

    controller.canister.get_my_permissions().then(({ permissions }) => {
      if (!permissions.length) {
        return;
      }
      setCanisterToCreateVersion(binaryController);
    });
  }, [data.get_binary_controller, setCanisterToCreateVersion]);

  const versions = useMemo(
    () =>
      (data.get_binary_version_infos?.infos || []).sort(
        (a, b) => Number(b.created_at) - Number(a.created_at),
      ),
    [data.get_binary_version_infos?.infos],
  );

  const handleDownload = useCallback((name: string, bytes: number[]) => {
    const file = new File([new Uint8Array(bytes)], `${name}.wasm`, { type: 'application/wasm' });

    downloadFile(file);
  }, []);

  const progress = !!fetching.get_binary_versions || !!fetching.get_binary_version_infos;

  return (
    <Container {...p}>
      <Title variant='h2'>Версии union-кошельков</Title>
      {!!canisterToCreateVersion && (
        <AddButton forwardedAs={NavLink} to={`/wallet/${canisterToCreateVersion}/versions/create`}>
          Create version
        </AddButton>
      )}
      {progress && <Text>fetching</Text>}
      {!progress && !versions.length && <Text>Versions list is empty</Text>}
      {versions.map((v) => (
        <Item key={v.version}>
          <Text>Version: {v.version}</Text>
          <Text>Description: {v.description}</Text>
          <Text>Status: {Object.keys(v.status)[0]}</Text>
          <Text>
            Created at:{' '}
            {moment(Math.ceil(Number(v.created_at) / 10 ** 6)).format('DD-MM-YY HH:mm:ss')}
          </Text>
          <Text>
            Updated at:{' '}
            {moment(Math.ceil(Number(v.updated_at) / 10 ** 6)).format('DD-MM-YY HH:mm:ss')}
          </Text>
          {!!v.binary[0] && (
            <Button onClick={() => handleDownload(`wallet-${v.version}`, v.binary[0]!)}>
              Download
            </Button>
          )}
        </Item>
      ))}
    </Container>
  );
};
