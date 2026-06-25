/**
 * Seed profesional — usuarios del sistema, 50 clientes independientes,
 * 15 categorías, productos con stock e imágenes, 15 mesas, direcciones
 * y ventas de ejemplo para reportes.
 * Ejecutar con: npx ts-node -r tsconfig-paths/register src/seed/seed.ts
 */
import 'dotenv/config';
import { DataSource, Repository } from 'typeorm';
import { Rol } from 'src/roles/entities/rol.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Cliente, GrupoCliente } from 'src/clientes/entities/cliente.entity';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { Mesa, EstadoMesa } from 'src/mesas/entities/mesa.entity';
import { DireccionEnvio } from 'src/direcciones-envio/entities/direccion-envio.entity';
import { EstadoPedido, Pedido, TipoEntrega } from 'src/pedidos/entities/pedido.entity';
import { DetallePedido } from 'src/detalles-pedido/entities/detalle-pedido.entity';
import { EstadoPago, MetodoPago, Pago } from 'src/pagos/entities/pago.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'usr_gambu',
  password: process.env.DB_PASSWORD ?? '1234567',
  database: process.env.DB_NAME ?? 'sis257_gambu',
  synchronize: true,
  logging: false,
  entities: [Rol, Usuario, Cliente, Categoria, Producto, Mesa, DireccionEnvio, Pedido, DetallePedido, Pago],
});

async function findOrCreate<T extends object>(
  repo: Repository<T>,
  where: Partial<T>,
  data: Partial<T>,
): Promise<T> {
  const existing = await repo.findOne({ where: where as any });
  if (existing) {
    Object.assign(existing, data);
    return repo.save(existing as any);
  }
  const entity = repo.create(data as any) as T;
  return repo.save(entity as any);
}


function redondearMonto(valor: number): number {
  return Number(Number(valor || 0).toFixed(2));
}

function porcentajeDescuentoDemo(grupoCliente: GrupoCliente, montoOriginal: number): number {
  if (grupoCliente === GrupoCliente.VIP) {
    if (montoOriginal >= 200) return 10;
    if (montoOriginal >= 100) return 8;
    return 5;
  }
  if (grupoCliente === GrupoCliente.CORPORATIVO) {
    if (montoOriginal >= 400) return 15;
    if (montoOriginal >= 200) return 12;
    return 8;
  }
  return 0;
}

function fechaHaceDias(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(10 + (dias % 10), 15, 0, 0);
  return fecha;
}

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Conexión establecida');

  const rolRepo = AppDataSource.getRepository(Rol);
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const clienteRepo = AppDataSource.getRepository(Cliente);
  const categoriaRepo = AppDataSource.getRepository(Categoria);
  const productoRepo = AppDataSource.getRepository(Producto);
  const mesaRepo = AppDataSource.getRepository(Mesa);
  const direccionRepo = AppDataSource.getRepository(DireccionEnvio);
  const pedidoRepo = AppDataSource.getRepository(Pedido);
  const detalleRepo = AppDataSource.getRepository(DetallePedido);
  const pagoRepo = AppDataSource.getRepository(Pago);

  const roles: Record<string, Rol> = {};
  for (const nombreRol of ['Administrador', 'Cajero', 'Mesero', 'Delivery']) {
    roles[nombreRol] = await findOrCreate(rolRepo, { nombreRol } as Partial<Rol>, { nombreRol } as Partial<Rol>);
  }

  const usuariosBase = [
    { usuario: 'admin', clave: 'admin123', nombre: 'Administrador', apellido: 'Sistema', email: 'admin@gambu.com', telefono: '70000001', rol: 'Administrador' },
    { usuario: 'cajero', clave: 'cajero123', nombre: 'María', apellido: 'Salazar', email: 'cajero@gambu.com', telefono: '70000002', rol: 'Cajero' },
    { usuario: 'mesero', clave: 'mesero123', nombre: 'Luis', apellido: 'Mamani', email: 'mesero@gambu.com', telefono: '70000003', rol: 'Mesero' },
    { usuario: 'delivery', clave: 'delivery123', nombre: 'Carlos', apellido: 'Flores', email: 'delivery@gambu.com', telefono: '70000004', rol: 'Delivery' },
    { usuario: 'repartidor', clave: 'reparto123', nombre: 'Carlos', apellido: 'Flores', email: 'repartidor@gambu.com', telefono: '70000005', rol: 'Delivery' },
  ];

  for (const u of usuariosBase) {
    await findOrCreate(
      usuarioRepo,
      { usuario: u.usuario } as Partial<Usuario>,
      {
        idRol: roles[u.rol].id,
        usuario: u.usuario,
        clave: u.clave,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        telefono: u.telefono,
      } as Partial<Usuario>,
    );
  }

  const nombres = ['Ana', 'Diego', 'Lucía', 'Marco', 'Sofía', 'Pablo', 'Valeria', 'Jorge', 'Carla', 'Miguel', 'Natalia', 'Rodrigo', 'Camila', 'Daniel', 'Fernanda', 'Óscar', 'Melissa', 'Bruno', 'Adriana', 'Raúl', 'Paola', 'Héctor', 'Ximena', 'Sergio', 'Elena', 'Tomás', 'Gabriela', 'Andrés', 'Mariana', 'Esteban', 'Rosa', 'Cristian', 'Mónica', 'Alvaro', 'Patricia', 'Kevin', 'Claudia', 'Nelson', 'Jimena', 'Gustavo', 'Lorena', 'Iván', 'Noelia', 'Mauricio', 'Bianca', 'Roxana', 'Javier', 'Silvia', 'Ramiro', 'Daniela'];
  const apellidos = ['Rojas', 'Quispe', 'Vargas', 'Paz', 'Ríos', 'Nina', 'Mora', 'Medina', 'Suárez', 'Arias', 'León', 'Mejía', 'Torrez', 'Molina', 'Vega', 'Castro', 'Aguilar', 'Soto', 'Luna', 'Mendoza', 'Calle', 'Romero', 'Blanco', 'Mamani', 'Paredes', 'Cardozo', 'Ortiz', 'Salinas', 'Reyes', 'Choque', 'Flores', 'Daza', 'López', 'Miranda', 'Gutiérrez', 'García', 'Herrera', 'Camacho', 'Rivera', 'Pinto', 'Villarroel', 'Cruz', 'Navarro', 'Cordero', 'Arce', 'Montaño', 'Quiroga', 'Alarcón', 'Serrano', 'Delgado'];
  const grupos = [GrupoCliente.REGULAR, GrupoCliente.FRECUENTE, GrupoCliente.VIP, GrupoCliente.CORPORATIVO];
  const zonas = ['Centro', 'Mercado Campesino', 'Barrio Petrolero', 'Av. Las Américas', 'Zona Terminal', 'Recoleta', 'San Roque', 'Lajastambo'];

  const clientes: Cliente[] = [];
  for (let i = 0; i < 50; i++) {
    const nombre = nombres[i];
    const apellido = apellidos[i];
    const grupoCliente = grupos[i % grupos.length];
    const telefono = `7${String(2000000 + i * 13579).slice(0, 7)}`;
    const email = i % 7 === 0 ? null : `${nombre}.${apellido}.${i + 1}@cliente-gambu.com`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const direccionPrincipal = `${zonas[i % zonas.length]}, Calle ${i + 1} #${120 + i * 7}`;

    const cliente = await findOrCreate(
      clienteRepo,
      { telefono } as Partial<Cliente>,
      {
        nombre,
        apellido,
        telefono,
        email,
        grupoCliente,
        direccionPrincipal,
        ciudad: 'Sucre',
        referenciaDireccion: i % 3 === 0 ? 'Llamar al llegar y entregar en recepción' : 'Referencia cercana a tienda o farmacia',
        activo: true,
      } as Partial<Cliente>,
    );
    clientes.push(cliente);

    await findOrCreate(
      direccionRepo,
      { idCliente: cliente.id, direccion: direccionPrincipal } as Partial<DireccionEnvio>,
      {
        idCliente: cliente.id,
        direccion: direccionPrincipal,
        ciudad: 'Sucre',
        indicacionesReferencia: cliente.referenciaDireccion || undefined,
      } as Partial<DireccionEnvio>,
    );
  }

  const categoriasBase = [
    ['Entradas', 'Piqueos y aperitivos para iniciar el pedido'],
    ['Hamburguesas', 'Hamburguesas artesanales con papas'],
    ['Pollo', 'Especialidades de pollo a la parrilla y broaster'],
    ['Mariscos', 'Platos preparados con pescado y mariscos'],
    ['Pastas', 'Pastas caseras y salsas especiales'],
    ['Bebidas', 'Refrescos, jugos naturales y bebidas calientes'],
    ['Postres', 'Postres de la casa'],
    ['Combos', 'Promociones completas para grupos y familias'],
    ['Ensaladas', 'Opciones frescas y saludables'],
    ['Parrillas', 'Carnes y acompañamientos a la parrilla'],
    ['Desayunos', 'Opciones para iniciar el día'],
    ['Cafetería', 'Cafés, infusiones y bebidas calientes'],
    ['Sopas', 'Sopas tradicionales y especiales'],
    ['Menú Infantil', 'Platos pensados para niños'],
    ['Promociones', 'Ofertas temporales del restaurante'],
  ];

  const categorias: Record<string, Categoria> = {};
  for (const [nombre, descripcion] of categoriasBase) {
    categorias[nombre] = await findOrCreate(categoriaRepo, { nombre } as Partial<Categoria>, { nombre, descripcion } as Partial<Categoria>);
  }

  const productosBase: Array<[string, string, string, number, string, number]> = [
    ['Entradas', 'Tequeños de queso', 'Porción de 8 unidades con salsa de la casa', 24, '/restaurant/bread1.jpg', 80],
    ['Entradas', 'Alitas BBQ', 'Alitas bañadas en salsa BBQ con papas', 38, '/restaurant/food_icon01.jpg', 75],
    ['Entradas', 'Papas Gambu', 'Papas fritas con cheddar, tocino y crema', 32, '/restaurant/corn.jpg', 70],
    ['Entradas', 'Nachos mixtos', 'Nachos con carne, queso y pico de gallo', 36, '/restaurant/featured.jpg', 65],
    ['Hamburguesas', 'Hamburguesa Clásica', 'Carne artesanal, queso, lechuga, tomate y papas', 42, '/restaurant/food_icon02.jpg', 90],
    ['Hamburguesas', 'Hamburguesa Doble Gambu', 'Doble carne, doble queso y salsa especial', 58, '/restaurant/featured.jpg', 85],
    ['Hamburguesas', 'Hamburguesa BBQ Bacon', 'Carne artesanal, tocino crocante y salsa BBQ', 52, '/restaurant/bagel.jpg', 80],
    ['Hamburguesas', 'Hamburguesa Crispy Chicken', 'Pollo crocante, queso y aderezo ranch', 46, '/restaurant/bread.jpg', 82],
    ['Pollo', 'Pollo Broaster personal', 'Pieza grande con papas y ensalada', 35, '/restaurant/food_icon03.jpg', 95],
    ['Pollo', 'Combo medio pollo', 'Medio pollo con papas, arroz y salsas', 68, '/restaurant/pricing.jpg', 76],
    ['Mariscos', 'Chicharrón de pescado', 'Pescado crocante con yuca y salsa tártara', 62, '/restaurant/beer_spec.jpg', 70],
    ['Mariscos', 'Ceviche mixto', 'Pescado y mariscos con limón y especias', 72, '/restaurant/limes.jpg', 65],
    ['Pastas', 'Fettuccine Alfredo', 'Pasta con salsa cremosa y parmesano', 48, '/restaurant/bread2.jpg', 70],
    ['Pastas', 'Lasagna de carne', 'Capas de pasta, carne, queso y salsa roja', 54, '/restaurant/pricing.jpg', 55],
    ['Bebidas', 'Limonada natural', 'Vaso grande de limonada fresca', 14, '/restaurant/limes.jpg', 120],
    ['Bebidas', 'Jugo de maracuyá', 'Jugo natural de temporada', 16, '/restaurant/food_icon06.jpg', 120],
    ['Postres', 'Brownie con helado', 'Brownie tibio con helado de vainilla', 28, '/restaurant/breakfast.jpg', 80],
    ['Postres', 'Cheesecake frutos rojos', 'Porción artesanal de cheesecake', 30, '/restaurant/food_icon01.jpg', 75],
    ['Combos', 'Combo familiar broaster', 'Pollo broaster familiar, papas, arroz y gaseosa', 145, '/restaurant/pricing.jpg', 45],
    ['Combos', 'Combo hamburguesa doble', 'Hamburguesa doble, papas y bebida', 68, '/restaurant/featured.jpg', 55],
    ['Ensaladas', 'Ensalada César', 'Lechuga fresca, pollo, crutones y parmesano', 36, '/restaurant/limes.jpg', 85],
    ['Ensaladas', 'Ensalada Gambu', 'Mix de hojas, palta, queso y aderezo especial', 39, '/restaurant/corn.jpg', 72],
    ['Parrillas', 'Bife a la parrilla', 'Corte jugoso con papas doradas', 86, '/restaurant/kabob.jpg', 48],
    ['Parrillas', 'Anticucho especial', 'Brochetas con papa y salsa de maní', 34, '/restaurant/kabob.jpg', 80],
    ['Desayunos', 'Desayuno americano', 'Huevos, pan, café y jugo', 32, '/restaurant/breakfast.jpg', 70],
    ['Desayunos', 'Tostadas francesas', 'Tostadas dulces con fruta de estación', 28, '/restaurant/bread.jpg', 66],
    ['Cafetería', 'Mocaccino', 'Café con chocolate y leche vaporizada', 18, '/restaurant/beer.jpg', 100],
    ['Cafetería', 'Capuccino', 'Café espresso con leche espumada', 17, '/restaurant/beer.jpg', 100],
    ['Sopas', 'Sopa de maní', 'Sopa tradicional con papas y carne', 26, '/restaurant/food_icon04.jpg', 65],
    ['Sopas', 'Caldo de pollo', 'Caldo casero con verduras', 24, '/restaurant/food_icon03.jpg', 70],
    ['Menú Infantil', 'Nuggets infantiles', 'Nuggets con papas y jugo pequeño', 29, '/restaurant/food_icon04.jpg', 88],
    ['Menú Infantil', 'Mini hamburguesa', 'Hamburguesa pequeña con papas', 31, '/restaurant/food_icon02.jpg', 86],
    ['Promociones', 'Promo 2x1 Limonada', 'Dos limonadas naturales por precio especial', 22, '/restaurant/limes.jpg', 90],
    ['Promociones', 'Promo amigos', '4 hamburguesas clásicas y papas grandes', 160, '/restaurant/bagel.jpg', 40],
  ];

  const productosGuardados: Producto[] = [];
  for (const [categoriaNombre, nombre, descripcion, precio, imagenUrl, stockActual] of productosBase) {
    const producto = await findOrCreate(
      productoRepo,
      { nombre } as Partial<Producto>,
      {
        idCategoria: categorias[categoriaNombre].id,
        nombre,
        descripcion,
        precio,
        imagenUrl,
        stockActual,
        stockMinimo: 10,
        disponible: stockActual > 0,
      } as Partial<Producto>,
    );
    productosGuardados.push(producto);
  }

  for (let numero = 1; numero <= 15; numero++) {
    const capacidad = numero <= 5 ? 2 : numero <= 11 ? 4 : 8;
    const estado = [2, 5, 8, 11].includes(numero) ? EstadoMesa.OCUPADA : numero === 15 ? EstadoMesa.RESERVADA : EstadoMesa.DISPONIBLE;
    await findOrCreate(
      mesaRepo,
      { numero } as Partial<Mesa>,
      {
        numero,
        capacidad,
        estado,
        descripcion: numero <= 5 ? 'Zona terraza' : numero <= 11 ? 'Salón principal' : 'Área familiar',
      } as Partial<Mesa>,
    );
  }

  const pedidosExistentes = await pedidoRepo.count();
  if (pedidosExistentes === 0) {
    const mesas = await mesaRepo.find({ order: { numero: 'ASC' } });
    const direcciones = await direccionRepo.find({ order: { id: 'ASC' } });
    const metodos = [MetodoPago.EFECTIVO, MetodoPago.QR, MetodoPago.TARJETA];

    for (let i = 0; i < 30; i++) {
      const cliente = clientes[i % clientes.length];
      const tipoEntrega = i % 3 === 0 ? TipoEntrega.DELIVERY : i % 3 === 1 ? TipoEntrega.EN_MESA : TipoEntrega.TAKE_AWAY;
      const fechaPago = fechaHaceDias(i % 45);
      const costoEnvio = tipoEntrega === TipoEntrega.DELIVERY ? 10 : 0;
      const mesa = tipoEntrega === TipoEntrega.EN_MESA ? mesas[(i % 10) + 1] : null;
      const direccion = tipoEntrega === TipoEntrega.DELIVERY ? direcciones.find((d) => d.idCliente === cliente.id) : null;
      const items = [productosGuardados[i % productosGuardados.length], productosGuardados[(i + 7) % productosGuardados.length]];
      if (i % 4 === 0) items.push(productosGuardados[(i + 14) % productosGuardados.length]);

      let subtotal = 0;
      const pedido = await pedidoRepo.save(
        pedidoRepo.create({
          idCliente: cliente.id,
          idDireccion: direccion?.id ?? null,
          idMesa: mesa?.id ?? null,
          estadoPedido: EstadoPedido.ENTREGADO,
          tipoEntrega,
          costoEnvio,
          total: 0,
          observaciones: tipoEntrega === TipoEntrega.DELIVERY ? 'Pedido demo para seguimiento delivery' : 'Venta de prueba cargada por seed',
          fechaCreacion: fechaPago,
          fechaModificacion: fechaPago,
        } as Partial<Pedido>),
      );

      for (let j = 0; j < items.length; j++) {
        const producto = items[j];
        const cantidad = (i + j) % 3 === 0 ? 2 : 1;
        const precioUnitario = Number(producto.precio);
        const subtotalDetalle = precioUnitario * cantidad;
        subtotal += subtotalDetalle;
        await detalleRepo.save(
          detalleRepo.create({
            idPedido: pedido.id,
            idProducto: producto.id,
            cantidad,
            precioUnitario,
            subtotal: subtotalDetalle,
            notasCocina: j === 0 ? 'Preparación estándar' : '',
            fechaCreacion: fechaPago,
            fechaModificacion: fechaPago,
          } as Partial<DetallePedido>),
        );
        producto.stockActual = Math.max(0, Number(producto.stockActual || 0) - cantidad);
        producto.disponible = Number(producto.stockActual) > 0;
        await productoRepo.save(producto);
      }

      pedido.total = subtotal + costoEnvio;
      await pedidoRepo.save(pedido);

      const montoOriginal = redondearMonto(Number(pedido.total || 0));
      const porcentajeDescuento = porcentajeDescuentoDemo(cliente.grupoCliente, montoOriginal);
      const descuentoAplicado = redondearMonto((montoOriginal * porcentajeDescuento) / 100);
      const montoFinal = redondearMonto(montoOriginal - descuentoAplicado);

      await pagoRepo.save(
        pagoRepo.create({
          idPedido: pedido.id,
          metodoPago: metodos[i % metodos.length],
          estadoPago: EstadoPago.APROBADO,
          transaccionId: `DEMO-${fechaPago.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
          montoOriginal,
          porcentajeDescuento,
          descuentoAplicado,
          monto: montoFinal,
          fechaPago,
          fechaCreacion: fechaPago,
          fechaModificacion: fechaPago,
        } as Partial<Pago>),
      );
    }
  }

  await AppDataSource.destroy();
  console.log('🎉 Seed finalizado. Accesos: admin/admin123, cajero/cajero123, mesero/mesero123, delivery/delivery123');
  console.log('👥 Clientes demo: 50 independientes. Catálogo: 15 categorías y más de 30 productos. Mesas: 15. Reportes: 30 ventas aprobadas.');
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err.message ?? err);
  process.exit(1);
});
