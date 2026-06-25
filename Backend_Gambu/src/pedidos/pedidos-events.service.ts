import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import { isDeliveryUser } from 'src/auth/utils/roles.util';
import { Pedido, TipoEntrega } from './entities/pedido.entity';

type PedidoEventPayload = {
  pedido?: Pedido;
  id?: number;
  tipoEntrega?: TipoEntrega;
};

@Injectable()
export class PedidosEventsService {
  private readonly eventos$ = new Subject<MessageEvent>();

  streamForUser(user: any): Observable<MessageEvent> {
    const stream = this.eventos$.asObservable();

    if (!isDeliveryUser(user)) return stream;

    return stream.pipe(
      filter((event) => {
        const data = event.data as PedidoEventPayload;
        const tipoEntrega = data?.pedido?.tipoEntrega ?? data?.tipoEntrega;
        return tipoEntrega === TipoEntrega.DELIVERY;
      }),
    );
  }

  emitPedidoCreado(pedido: Pedido): void {
    this.emit('pedido-creado', { pedido });
  }

  emitPedidoActualizado(pedido: Pedido): void {
    this.emit('pedido-actualizado', { pedido });
  }

  emitPedidoEliminado(pedido: Pedido): void {
    this.emit('pedido-eliminado', { id: pedido.id, tipoEntrega: pedido.tipoEntrega });
  }

  private emit(type: string, data: PedidoEventPayload): void {
    this.eventos$.next({ type, data });
  }
}
